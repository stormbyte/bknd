import { Exception } from "core";

export class UserExistsException extends Exception {
   override name = "UserExistsException";
   override code = 422;

   constructor() {
      super("User already exists");
   }
}

export class UserNotFoundException extends Exception {
   override name = "UserNotFoundException";
   override code = 404;

   constructor() {
      super("User not found");
   }
}

export class InvalidCredentialsException extends Exception {
   override name = "InvalidCredentialsException";
   override code = 401;

   constructor() {
      super("Invalid credentials");
   }
}
