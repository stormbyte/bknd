# bknd 
**Feature-rich backend built to run anywhere.**  

bknd simplifies backend development by providing powerful tools for data management, workflows, authentication, and media handling—all seamlessly integrated into a developer-friendly platform.

**For documentation and examples, please visit https://docs.bknd.io.**

> [!WARNING]
> Please keep in mind that **bknd** is still under active development
> and therefore full backward compatibility is not guaranteed before reaching v1.0.0.


## Why bknd?
**Developer-Centric**: Focus on building your app—bknd handles the heavy lifting.  
**Scalable**: Designed to run in any JavaScript environment (cloud or edge) 
databases.  
**Integrated**: Everything from data to workflows, auth, and media, in one cohesive platform.


## ✨ Features
- **📊 Data**: Define, query, and control your data with ease. 
  - Define entities with fields and relationships, synced directly to your database.  
  - Supported field types: `primary`, `text`, `number`, `date`, `boolean`, `enum`, `json`, `jsonschema`.  
  - Relationship types: `one-to-one`, `many-to-one`, `many-to-many`, and `polymorphic`.  
  - Advanced querying with the **Repository**: filtering, sorting, pagination, and relational data handling.
  - Seamlessly manage data with mutators and a robust event system.  
  - Extend database functionality with batching, introspection, and support for multiple SQL dialects.

- **🔐 Auth**: Easily implement reliable authentication strategies.
  - Built-in `user` entity with customizable fields.  
  - Supports multiple authentication strategies:  
    - Email/password (with hashed storage).  
    - OAuth/OIDC (Google, GitHub, and more).  
  - Secure JWT generation and session management.

- **🖼️ Media**: Effortlessly manage and serve all your media files.
  - Upload files with ease.  
  - Adapter-based support for S3, S3-compatible storage (e.g., R2, Tigris), and Cloudinary.

- **🔄 Flows**: Design and run workflows with seamless automation.
  - Create and run workflows with trigger-based automation:  
    - Manual triggers or events from data, auth, media, or server actions.  
    - HTTP triggers for external integrations.  
  - Define tasks in sequence, parallel, or loops, with conditional execution.  
  - Use reusable sub-workflows to organize complex processes.  
  - Leverage OpenAPI specifications for API-based tasks.


## 🚀 Quick start
To quickly spin up an instance, run:
```bash
npx bknd run
```

### Installation  
```bash
npm install bknd
```
