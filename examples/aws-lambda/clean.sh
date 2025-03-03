#!/bin/bash

# Set variables
FUNCTION_NAME="bknd-lambda"
ROLE_NAME="bknd-lambda-execution-role"

echo "Starting cleanup of AWS resources..."

# Delete Function URL if it exists
echo "Checking if Function URL exists for '$FUNCTION_NAME'..."
FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --query "FunctionUrl" --output text 2>/dev/null)

if [ -n "$FUNCTION_URL" ]; then
  echo "Deleting Function URL for '$FUNCTION_NAME'..."
  aws lambda delete-function-url-config --function-name $FUNCTION_NAME
  echo "Function URL deleted."
else
  echo "No Function URL found for '$FUNCTION_NAME'."
fi

# Delete Lambda function if it exists
echo "Checking if Lambda function '$FUNCTION_NAME' exists..."
LAMBDA_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --query "Configuration.FunctionArn" --output text 2>/dev/null)

if [ -n "$LAMBDA_EXISTS" ]; then
  echo "Deleting Lambda function '$FUNCTION_NAME'..."
  aws lambda delete-function --function-name $FUNCTION_NAME
  echo "Lambda function deleted."
else
  echo "Lambda function '$FUNCTION_NAME' does not exist."
fi

# Delete IAM role and attached policies if role exists
echo "Checking if IAM role '$ROLE_NAME' exists..."
ROLE_EXISTS=$(aws iam get-role --role-name $ROLE_NAME --query "Role.Arn" --output text 2>/dev/null)

if [ -n "$ROLE_EXISTS" ]; then
  echo "Detaching policies from IAM role '$ROLE_NAME'..."
  ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name $ROLE_NAME --query "AttachedPolicies[].PolicyArn" --output text)

  for POLICY_ARN in $ATTACHED_POLICIES; do
    aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn $POLICY_ARN
    echo "Detached policy: $POLICY_ARN"
  done

  echo "Deleting IAM role '$ROLE_NAME'..."
  aws iam delete-role --role-name $ROLE_NAME
  echo "IAM role deleted."
else
  echo "IAM role '$ROLE_NAME' does not exist."
fi

echo "AWS resource cleanup completed successfully!"