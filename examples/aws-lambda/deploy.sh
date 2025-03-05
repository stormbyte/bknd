#!/bin/bash

# Set variables
FUNCTION_NAME="bknd-lambda"
ROLE_NAME="bknd-lambda-execution-role"
RUNTIME="nodejs22.x"
HANDLER="index.handler"
ARCHITECTURE="arm64" # or "x86_64"
MEMORY="1024" # in MB, 128 is the minimum
TIMEOUT="30"
ENTRY_FILE="index.mjs"
ZIP_FILE="lambda.zip"

# Build step
echo "Building Lambda package..."
rm -rf dist && mkdir dist

# copy assets
node_modules/.bin/bknd copy-assets --out=dist/static

# Run esbuild and check for errors
# important to use --platform=browser for libsql dependency (otherwise we need to push node_modules)
if ! npx esbuild $ENTRY_FILE --bundle --format=cjs --platform=browser --external:fs --minify --outfile=dist/index.js; then
  echo "Error: esbuild failed to build the package"
  exit 1
fi

# zip
( cd dist && zip -r $ZIP_FILE . )

# Read .env file and export variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found!"
  exit 1
fi

# Prepare environment variables string for Lambda
ENV_VARS=$(awk -F= '{printf "%s=\"%s\",", $1, $2}' .env | sed 's/,$//')

# Create a trust policy file for the Lambda execution role
cat > trust-policy.json << EOL
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOL

# Create IAM role if it doesn't exist
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text 2>/dev/null)

if [ -z "$ROLE_ARN" ]; then
  echo "Creating IAM role..."
  aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust-policy.json
  aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  # Wait for IAM role to propagate
  echo "Waiting for IAM role to propagate..."
  sleep 10

  # Get the role ARN after creation
  ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text)
else
  echo "Using existing IAM role: $ROLE_ARN"
fi

# Create or update Lambda function
echo "Creating or updating Lambda function..."
LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query "Configuration.FunctionArn" --output text 2>/dev/null)

if [ -z "$LAMBDA_ARN" ]; then
  echo "Creating new Lambda function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://dist/$ZIP_FILE \
    --handler $HANDLER \
    --runtime $RUNTIME \
    --role $ROLE_ARN \
    --architectures $ARCHITECTURE \
    --memory-size $MEMORY \
    --timeout $TIMEOUT \
    --environment Variables="{$ENV_VARS}"
else
  echo "Updating existing Lambda function..."
  aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://dist/$ZIP_FILE

  echo "Waiting for Lambda function to become active..."
  aws lambda wait function-updated --function-name $FUNCTION_NAME

  # Update function configuration, including env variables
  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --memory-size $MEMORY \
    --timeout $TIMEOUT \
    --environment Variables="{$ENV_VARS}"
fi

# Check if Function URL exists, if not create it
echo "Checking if Function URL exists..."
FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --query "FunctionUrl" --output text 2>/dev/null)

if [ -z "$FUNCTION_URL" ]; then
  echo "Creating Function URL..."
  FUNCTION_URL=$(aws lambda create-function-url-config \
    --function-name $FUNCTION_NAME \
    --auth-type NONE \
    --query "FunctionUrl" --output text)

  # Make the Function URL publicly accessible (log output)
  aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --statement-id public-access \
    --function-url-auth-type NONE

  echo "Created Lambda Function URL: $FUNCTION_URL"
else
  echo "Lambda Function URL: $FUNCTION_URL"
fi

echo "Deployment completed successfully!"