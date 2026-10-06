export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "FarmerChoice API - Farmer Carbon Credit Readiness Assessment Platform",
    version: "1.0.0",
    description:
      "Production-grade backend API for FarmerChoice. Evaluates farmer carbon-credit readiness based on farming practices, land details, crop history, and verifiable evidence. Note: This assessment estimates preparedness based on a prototype assessment model and is not an official carbon-credit certification.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token obtained from /api/auth/login or /api/auth/register",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Invalid request payload" },
              details: { type: "object" },
            },
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "farmer.ramesh@farmerchoice.demo" },
          password: { type: "string", minLength: 6, example: "Password#2026" },
          role: { type: "string", enum: ["FARMER", "ADMIN"], default: "FARMER" },
          name: { type: "string", example: "Ramesh Patel" },
          phone: { type: "string", example: "+91 98765 43210" },
          state: { type: "string", example: "Maharashtra" },
          district: { type: "string", example: "Nagpur" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "farmer.ramesh@farmerchoice.demo" },
          password: { type: "string", example: "Password#2026" },
        },
      },
      FarmRequest: {
        type: "object",
        required: [
          "name",
          "areaAcres",
          "soilType",
          "irrigationMethod",
          "waterSource",
          "fertilizerUsage",
          "pesticideUsage",
          "tillageMethod",
          "residueManagement",
        ],
        properties: {
          name: { type: "string", example: "Green Valley Farm" },
          areaAcres: { type: "number", example: 12.5 },
          soilType: { type: "string", example: "Black Soil (Vertisol)" },
          irrigationMethod: { type: "string", example: "Drip Irrigation" },
          waterSource: { type: "string", example: "Rainwater Pond & Borewell" },
          fertilizerUsage: { type: "string", example: "ORGANIC (VERMICOMPOST)" },
          fertilizerCategory: { type: "string", enum: ["ORGANIC", "SYNTHETIC", "INTEGRATED"], example: "ORGANIC" },
          organicFertilizerType: {
            type: "string",
            enum: ["COMPOST", "FARMYARD_MANURE", "VERMICOMPOST", "BIOFERTILIZER", "GREEN_MANURE", "OTHER"],
            example: "VERMICOMPOST",
          },
          pesticideUsage: { type: "string", example: "Integrated Pest Management (Neem)" },
          tillageMethod: { type: "string", example: "Zero Tillage" },
          residueManagement: { type: "string", example: "In-situ Mulching & Biochar" },
          organicPractices: { type: "boolean", default: true },
        },
      },
      AssessmentResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          farmId: { type: "string", format: "uuid" },
          overallScore: { type: "number", example: 82 },
          status: { type: "string", example: "HIGH_READINESS" },
          readinessLevel: { type: "string", example: "HIGH_READINESS" },
          readinessLabel: { type: "string", example: "High Readiness" },
          engineVersion: { type: "string", example: "1.1.0" },
          categories: {
            type: "object",
            properties: {
              farmingPractices: { type: "number", example: 85 },
              soilManagement: { type: "number", example: 90 },
              irrigation: { type: "number", example: 95 },
              cropHistory: { type: "number", example: 80 },
              documentation: { type: "number", example: 70 },
              evidenceQuality: { type: "number", example: 65 },
            },
          },
          strengths: { type: "array", items: { type: "string" } },
          gaps: { type: "array", items: { type: "string" } },
          factors: { type: "array", items: { type: "string" } },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                category: { type: "string" },
                priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                message: { type: "string" },
                completed: { type: "boolean" },
              },
            },
          },
          disclaimer: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Service Health Check",
        tags: ["System"],
        responses: { 200: { description: "Service is healthy" } },
      },
    },
    "/ready": {
      get: {
        summary: "Database Readiness Check",
        tags: ["System"],
        responses: { 200: { description: "Database connection verified" } },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Register new user/farmer",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: { 201: { description: "User registered successfully" } },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Login and receive JWT token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: { 200: { description: "Login successful" } },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Get current authenticated user profile",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Current user profile" } },
      },
    },
    "/api/farmers/me": {
      get: {
        summary: "Get farmer profile and farm overview",
        tags: ["Farmers"],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Farmer profile" } },
      },
      put: {
        summary: "Update farmer contact/location profile",
        tags: ["Farmers"],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Farmer profile updated" } },
      },
    },
    "/api/farms": {
      get: {
        summary: "List all farms for the logged-in user",
        tags: ["Farms"],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "List of farms" } },
      },
      post: {
        summary: "Register a new farm with practices",
        tags: ["Farms"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/FarmRequest" } } },
        },
        responses: { 201: { description: "Farm created" } },
      },
    },
    "/api/farms/{id}": {
      get: {
        summary: "Get farm details by ID",
        tags: ["Farms"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Farm details" } },
      },
      put: {
        summary: "Update farm details and practices",
        tags: ["Farms"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Farm updated" } },
      },
      delete: {
        summary: "Delete a farm",
        tags: ["Farms"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Farm deleted" } },
      },
    },
    "/api/crops": {
      post: {
        summary: "Add crop history record",
        tags: ["Crops"],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: "Crop record created" } },
      },
    },
    "/api/crops/farm/{farmId}": {
      get: {
        summary: "Get crop history for a farm",
        tags: ["Crops"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "farmId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "List of crop records" } },
      },
    },
    "/api/documents/upload": {
      post: {
        summary: "Upload document evidence (PDF, JPG, PNG)",
        tags: ["Documents"],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: "Document uploaded and parsed" } },
      },
    },
    "/api/documents/farm/{farmId}": {
      get: {
        summary: "Get documents for a farm",
        tags: ["Documents"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "farmId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Documents list" } },
      },
    },
    "/api/documents/farm/{farmId}/evidence-summary": {
      get: {
        summary: "Get evidence audit summary (verified, pending, missing, quality score)",
        tags: ["Documents"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "farmId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Evidence audit summary" } },
      },
    },
    "/api/assessments": {
      post: {
        summary: "Run carbon credit readiness assessment for a farm",
        tags: ["Assessments"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { farmId: { type: "string" } } } } },
        },
        responses: { 201: { description: "Assessment generated" } },
      },
    },
    "/api/assessments/{id}": {
      get: {
        summary: "Get assessment details by ID",
        tags: ["Assessments"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Assessment details" } },
      },
    },
    "/api/assessments/{id}/recalculate": {
      post: {
        summary: "Recalculate readiness assessment (creates new version)",
        tags: ["Assessments"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 201: { description: "New assessment generated" } },
      },
    },
    "/api/assessments/farm/{farmId}": {
      get: {
        summary: "Get assessment progress history for a farm",
        tags: ["Assessments"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "farmId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Assessment history" } },
      },
    },
    "/api/admin/dashboard": {
      get: {
        summary: "Admin dashboard metrics and overview",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Dashboard metrics" } },
      },
    },
    "/api/admin/statistics": {
      get: {
        summary: "Aggregated adoption statistics and document breakdown",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Statistical aggregates" } },
      },
    },
  },
};
