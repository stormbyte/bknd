import { Exception, Permission } from "core";
import { type Static, Type, objectTransform } from "core/utils";
import { Role } from "./Role";

export type GuardUserContext = {
   role: string | null | undefined;
   [key: string]: any;
};

export type GuardConfig = {
   enabled?: boolean;
};

export class Guard {
   permissions: Permission[];
   user?: GuardUserContext;
   roles?: Role[];
   config?: GuardConfig;

   constructor(permissions: Permission[] = [], roles: Role[] = [], config?: GuardConfig) {
      this.permissions = permissions;
      this.roles = roles;
      this.config = config;
   }

   static create(
      permissionNames: string[],
      roles?: Record<
         string,
         {
            permissions?: string[];
            is_default?: boolean;
            implicit_allow?: boolean;
         }
      >,
      config?: GuardConfig
   ) {
      const _roles = roles
         ? objectTransform(roles, ({ permissions = [], is_default, implicit_allow }, name) => {
              return Role.createWithPermissionNames(name, permissions, is_default, implicit_allow);
           })
         : {};
      const _permissions = permissionNames.map((name) => new Permission(name));
      return new Guard(_permissions, Object.values(_roles), config);
   }

   getPermissionNames(): string[] {
      return this.permissions.map((permission) => permission.name);
   }

   getPermissions(): Permission[] {
      return this.permissions;
   }

   permissionExists(permissionName: string): boolean {
      return !!this.permissions.find((p) => p.name === permissionName);
   }

   setRoles(roles: Role[]) {
      this.roles = roles;
      return this;
   }

   getRoles() {
      return this.roles;
   }

   setConfig(config: Partial<GuardConfig>) {
      this.config = { ...this.config, ...config };
      return this;
   }

   registerPermission(permission: Permission) {
      if (this.permissions.find((p) => p.name === permission.name)) {
         throw new Error(`Permission ${permission.name} already exists`);
      }

      this.permissions.push(permission);
      return this;
   }

   registerPermissions(permissions: Permission[]) {
      for (const permission of permissions) {
         this.registerPermission(permission);
      }

      return this;
   }

   setUserContext(user: GuardUserContext | undefined) {
      this.user = user;
      return this;
   }

   getUserRole(): Role | undefined {
      if (this.user && typeof this.user.role === "string") {
         const role = this.roles?.find((role) => role.name === this.user?.role);
         if (role) {
            console.log("guard: role found", this.user.role);
            return role;
         }
      }

      console.log("guard: role not found", this.user, this.user?.role);
      return this.getDefaultRole();
   }

   getDefaultRole(): Role | undefined {
      return this.roles?.find((role) => role.is_default);
   }

   hasPermission(permission: Permission): boolean;
   hasPermission(name: string): boolean;
   hasPermission(permissionOrName: Permission | string): boolean {
      if (this.config?.enabled !== true) {
         //console.log("guard not enabled, allowing");
         return true;
      }

      const name = typeof permissionOrName === "string" ? permissionOrName : permissionOrName.name;
      const exists = this.permissionExists(name);
      if (!exists) {
         throw new Error(`Permission ${name} does not exist`);
      }

      const role = this.getUserRole();

      if (!role) {
         console.log("guard: role not found, denying");
         return false;
      } else if (role.implicit_allow === true) {
         console.log("guard: role implicit allow, allowing");
         return true;
      }

      const rolePermission = role.permissions.find(
         (rolePermission) => rolePermission.permission.name === name
      );

      console.log("guard: rolePermission, allowing?", {
         permission: name,
         role: role.name,
         allowing: !!rolePermission
      });
      return !!rolePermission;
   }

   granted(permission: Permission | string): boolean {
      return this.hasPermission(permission as any);
   }

   throwUnlessGranted(permission: Permission | string) {
      if (!this.granted(permission)) {
         throw new Exception(
            `Permission "${typeof permission === "string" ? permission : permission.name}" not granted`,
            403
         );
      }
   }
}
