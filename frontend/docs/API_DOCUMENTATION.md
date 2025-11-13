\# ============================================

\# FILE: docs/API\_DOCUMENTATION.md

\# ============================================

\# API Documentation - Fundraising Portal



\## Base URL

```

Development: http://localhost:5000/api

Production: https://your-backend.railway.app/api

```



\## Authentication

All protected endpoints require JWT token in header:

```

Authorization: Bearer <your\_jwt\_token>

```



---



\## 1. Authentication Endpoints



\### 1.1 Register User (FR-001)

\*\*POST\*\* `/auth/register`



\*\*Request Body:\*\*

```json

{

&nbsp; "name": "John Doe",

&nbsp; "email": "john@example.com",

&nbsp; "password": "Password@123",

&nbsp; "role": "donor"

}

```



\*\*Response (201):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "User registered successfully",

&nbsp; "data": {

&nbsp;   "user": {

&nbsp;     "id": "uuid",

&nbsp;     "name": "John Doe",

&nbsp;     "email": "john@example.com",

&nbsp;     "role": "donor"

&nbsp;   },

&nbsp;   "token": "jwt\_token\_here"

&nbsp; }

}

```



\### 1.2 Login User (FR-001)

\*\*POST\*\* `/auth/login`



\*\*Request Body:\*\*

```json

{

&nbsp; "email": "john@example.com",

&nbsp; "password": "Password@123"

}

```



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "Login successful",

&nbsp; "data": {

&nbsp;   "user": {

&nbsp;     "id": "uuid",

&nbsp;     "name": "John Doe",

&nbsp;     "email": "john@example.com",

&nbsp;     "role": "donor"

&nbsp;   },

&nbsp;   "token": "jwt\_token\_here"

&nbsp; }

}

```



\### 1.3 Get User Profile

\*\*GET\*\* `/auth/profile`  

\*\*Auth Required:\*\* Yes



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "id": "uuid",

&nbsp;   "name": "John Doe",

&nbsp;   "email": "john@example.com",

&nbsp;   "role": "donor",

&nbsp;   "created\_at": "2025-10-24T10:00:00Z"

&nbsp; }

}

```



---



\## 2. Event Endpoints



\### 2.1 Get All Events (FR-004)

\*\*GET\*\* `/events`



\*\*Query Parameters:\*\*

\- `status` (optional): pending, active, completed

\- `category` (optional): education, health, emergency, etc.

\- `search` (optional): search in title/description

\- `page` (optional): page number (default: 1)

\- `limit` (optional): items per page (default: 10)



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "events": \[

&nbsp;     {

&nbsp;       "id": "uuid",

&nbsp;       "title": "Help Build School",

&nbsp;       "description": "We need funds to build...",

&nbsp;       "target\_amount": 50000.00,

&nbsp;       "current\_amount": 15000.00,

&nbsp;       "progress\_percentage": 30,

&nbsp;       "category": "education",

&nbsp;       "status": "active",

&nbsp;       "organizer": {

&nbsp;         "id": "uuid",

&nbsp;         "name": "Jane Organizer"

&nbsp;       },

&nbsp;       "pledge\_count": 25,

&nbsp;       "created\_at": "2025-10-20T10:00:00Z"

&nbsp;     }

&nbsp;   ],

&nbsp;   "pagination": {

&nbsp;     "current\_page": 1,

&nbsp;     "total\_pages": 5,

&nbsp;     "total\_items": 50

&nbsp;   }

&nbsp; }

}

```



\### 2.2 Get Event Details (FR-004)

\*\*GET\*\* `/events/:id`



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "id": "uuid",

&nbsp;   "title": "Help Build School",

&nbsp;   "description": "Detailed description...",

&nbsp;   "target\_amount": 50000.00,

&nbsp;   "current\_amount": 15000.00,

&nbsp;   "progress\_percentage": 30,

&nbsp;   "category": "education",

&nbsp;   "image\_url": "https://...",

&nbsp;   "status": "active",

&nbsp;   "start\_date": "2025-10-20T10:00:00Z",

&nbsp;   "end\_date": "2025-12-31T23:59:59Z",

&nbsp;   "organizer": {

&nbsp;     "id": "uuid",

&nbsp;     "name": "Jane Organizer",

&nbsp;     "email": "jane@example.com"

&nbsp;   },

&nbsp;   "pledges": \[

&nbsp;     {

&nbsp;       "id": "uuid",

&nbsp;       "amount": 100.00,

&nbsp;       "is\_anonymous": false,

&nbsp;       "donor\_name": "John Doe",

&nbsp;       "message": "Great cause!",

&nbsp;       "created\_at": "2025-10-24T10:00:00Z"

&nbsp;     }

&nbsp;   ],

&nbsp;   "pledge\_count": 25,

&nbsp;   "unique\_donors": 20

&nbsp; }

}

```



\### 2.3 Create Event (FR-002)

\*\*POST\*\* `/events`  

\*\*Auth Required:\*\* Yes (Organizer role)



\*\*Request Body:\*\*

```json

{

&nbsp; "title": "Help Build School",

&nbsp; "description": "We need funds to build a school in rural area...",

&nbsp; "target\_amount": 50000.00,

&nbsp; "category": "education",

&nbsp; "image\_url": "https://example.com/image.jpg",

&nbsp; "end\_date": "2025-12-31T23:59:59Z"

}

```



\*\*Response (201):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "Event created successfully",

&nbsp; "data": {

&nbsp;   "id": "uuid",

&nbsp;   "title": "Help Build School",

&nbsp;   "status": "pending",

&nbsp;   "created\_at": "2025-10-24T10:00:00Z"

&nbsp; }

}

```



\### 2.4 Update Event (FR-003)

\*\*PUT\*\* `/events/:id`  

\*\*Auth Required:\*\* Yes (Owner only)



\*\*Request Body:\*\*

```json

{

&nbsp; "title": "Updated Title",

&nbsp; "description": "Updated description",

&nbsp; "target\_amount": 60000.00

}

```



\### 2.5 Delete Event (FR-003)

\*\*DELETE\*\* `/events/:id`  

\*\*Auth Required:\*\* Yes (Owner only)



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "Event deleted successfully"

}

```



\### 2.6 Search Events (FR-013)

\*\*GET\*\* `/events/search?q=school`



---



\## 3. Pledge Endpoints



\### 3.1 Submit Pledge (FR-005)

\*\*POST\*\* `/pledges`  

\*\*Auth Required:\*\* Yes



\*\*Request Body:\*\*

```json

{

&nbsp; "event\_id": "uuid",

&nbsp; "amount": 100.00,

&nbsp; "is\_anonymous": false,

&nbsp; "message": "Happy to support this cause!"

}

```



\*\*Response (201):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "Pledge submitted successfully",

&nbsp; "data": {

&nbsp;   "id": "uuid",

&nbsp;   "amount": 100.00,

&nbsp;   "event\_id": "uuid",

&nbsp;   "created\_at": "2025-10-24T10:00:00Z"

&nbsp; }

}

```



\### 3.2 Get My Pledges (FR-021)

\*\*GET\*\* `/pledges/my`  

\*\*Auth Required:\*\* Yes



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "id": "uuid",

&nbsp;     "amount": 100.00,

&nbsp;     "is\_anonymous": false,

&nbsp;     "message": "Great cause!",

&nbsp;     "event": {

&nbsp;       "id": "uuid",

&nbsp;       "title": "Help Build School",

&nbsp;       "status": "active"

&nbsp;     },

&nbsp;     "created\_at": "2025-10-24T10:00:00Z"

&nbsp;   }

&nbsp; ]

}

```



\### 3.3 Get Event Pledges (FR-006)

\*\*GET\*\* `/pledges/event/:eventId`



---



\## 4. Admin Endpoints



\### 4.1 Get All Events (FR-011)

\*\*GET\*\* `/admin/events`  

\*\*Auth Required:\*\* Yes (Admin only)



\*\*Response includes pending, active, rejected events\*\*



\### 4.2 Approve Event (FR-012)

\*\*PUT\*\* `/admin/events/:id/approve`  

\*\*Auth Required:\*\* Yes (Admin only)



\### 4.3 Reject Event (FR-012)

\*\*PUT\*\* `/admin/events/:id/reject`  

\*\*Auth Required:\*\* Yes (Admin only)



\*\*Request Body:\*\*

```json

{

&nbsp; "reason": "Insufficient details provided"

}

```



\### 4.4 Generate Reports (FR-014)

\*\*GET\*\* `/admin/reports`  

\*\*Auth Required:\*\* Yes (Admin only)



\*\*Query Parameters:\*\*

\- `type`: daily, weekly, monthly

\- `start\_date`: YYYY-MM-DD

\- `end\_date`: YYYY-MM-DD



---



\## Error Responses



\### 400 Bad Request

```json

{

&nbsp; "success": false,

&nbsp; "message": "Validation failed",

&nbsp; "errors": \[

&nbsp;   {

&nbsp;     "field": "email",

&nbsp;     "message": "Invalid email format"

&nbsp;   }

&nbsp; ]

}

```



\### 401 Unauthorized

```json

{

&nbsp; "success": false,

&nbsp; "message": "No token provided. Please login."

}

```



\### 403 Forbidden

```json

{

&nbsp; "success": false,

&nbsp; "message": "Access denied. Required role: admin"

}

```



\### 404 Not Found

```json

{

&nbsp; "success": false,

&nbsp; "message": "Event not found"

}

```



\### 500 Internal Server Error

```json

{

&nbsp; "success": false,

&nbsp; "message": "Internal server error"

}

```



---



\## Rate Limits



\- \*\*Auth endpoints\*\*: 5 requests per 15 minutes

\- \*\*Pledge submissions\*\*: 20 requests per hour

\- \*\*General API\*\*: 100 requests per 15 minutes



---



\## Postman Collection



Import this collection to test all endpoints:

\[Download Postman Collection](link-to-collection.json)



---



Last Updated: October 24, 2025



\# ============================================

\# FILE: docs/API\_DOCUMENTATION.md

\# ============================================

\# API Documentation - Fundraising Portal



\## Base URL

```

Development: http://localhost:5000/api

Production: https://your-backend.railway.app/api

```



\## Authentication

All protected endpoints require JWT token in header:

```

Authorization: Bearer <your\_jwt\_token>

```



---



\## 1. Authentication Endpoints



\### 1.1 Register User (FR-001)

\*\*POST\*\* `/auth/register`



\*\*Request Body:\*\*

```json

{

&nbsp; "name": "John Doe",

&nbsp; "email": "john@example.com",

&nbsp; "password": "Password@123",

&nbsp; "role": "donor"

}

```



\*\*Response (201):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "User registered successfully",

&nbsp; "data": {

&nbsp;   "user": {

&nbsp;     "id": "uuid",

&nbsp;     "name": "John Doe",

&nbsp;     "email": "john@example.com",

&nbsp;     "role": "donor"

&nbsp;   },

&nbsp;   "token": "jwt\_token\_here"

&nbsp; }

}

```



\### 1.2 Login User (FR-001)

\*\*POST\*\* `/auth/login`



\*\*Request Body:\*\*

```json

{

&nbsp; "email": "john@example.com",

&nbsp; "password": "Password@123"

}

```



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "Login successful",

&nbsp; "data": {

&nbsp;   "user": {

&nbsp;     "id": "uuid",

&nbsp;     "name": "John Doe",

&nbsp;     "email": "john@example.com",

&nbsp;     "role": "donor"

&nbsp;   },

&nbsp;   "token": "jwt\_token\_here"

&nbsp; }

}

```



\### 1.3 Get User Profile

\*\*GET\*\* `/auth/profile`  

\*\*Auth Required:\*\* Yes



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "id": "uuid",

&nbsp;   "name": "John Doe",

&nbsp;   "email": "john@example.com",

&nbsp;   "role": "donor",

&nbsp;   "created\_at": "2025-10-24T10:00:00Z"

&nbsp; }

}

```



---



\## 2. Event Endpoints



\### 2.1 Get All Events (FR-004)

\*\*GET\*\* `/events`



\*\*Query Parameters:\*\*

\- `status` (optional): pending, active, completed

\- `category` (optional): education, health, emergency, etc.

\- `search` (optional): search in title/description

\- `page` (optional): page number (default: 1)

\- `limit` (optional): items per page (default: 10)



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "events": \[

&nbsp;     {

&nbsp;       "id": "uuid",

&nbsp;       "title": "Help Build School",

&nbsp;       "description": "We need funds to build...",

&nbsp;       "target\_amount": 50000.00,

&nbsp;       "current\_amount": 15000.00,

&nbsp;       "progress\_percentage": 30,

&nbsp;       "category": "education",

&nbsp;       "status": "active",

&nbsp;       "organizer": {

&nbsp;         "id": "uuid",

&nbsp;         "name": "Jane Organizer"

&nbsp;       },

&nbsp;       "pledge\_count": 25,

&nbsp;       "created\_at": "2025-10-20T10:00:00Z"

&nbsp;     }

&nbsp;   ],

&nbsp;   "pagination": {

&nbsp;     "current\_page": 1,

&nbsp;     "total\_pages": 5,

&nbsp;     "total\_items": 50

&nbsp;   }

&nbsp; }

}

```



\### 2.2 Get Event Details (FR-004)

\*\*GET\*\* `/events/:id`



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "id": "uuid",

&nbsp;   "title": "Help Build School",

&nbsp;   "description": "Detailed description...",

&nbsp;   "target\_amount": 50000.00,

&nbsp;   "current\_amount": 15000.00,

&nbsp;   "progress\_percentage": 30,

&nbsp;   "category": "education",

&nbsp;   "image\_url": "https://...",

&nbsp;   "status": "active",

&nbsp;   "start\_date": "2025-10-20T10:00:00Z",

&nbsp;   "end\_date": "2025-12-31T23:59:59Z",

&nbsp;   "organizer": {

&nbsp;     "id": "uuid",

&nbsp;     "name": "Jane Organizer",

&nbsp;     "email": "jane@example.com"

&nbsp;   },

&nbsp;   "pledges": \[

&nbsp;     {

&nbsp;       "id": "uuid",

&nbsp;       "amount": 100.00,

&nbsp;       "is\_anonymous": false,

&nbsp;       "donor\_name": "John Doe",

&nbsp;       "message": "Great cause!",

&nbsp;       "created\_at": "2025-10-24T10:00:00Z"

&nbsp;     }

&nbsp;   ],

&nbsp;   "pledge\_count": 25,

&nbsp;   "unique\_donors": 20

&nbsp; }

}

```



\### 2.3 Create Event (FR-002)

\*\*POST\*\* `/events`  

\*\*Auth Required:\*\* Yes (Organizer role)



\*\*Request Body:\*\*

```json

{

&nbsp; "title": "Help Build School",

&nbsp; "description": "We need funds to build a school in rural area...",

&nbsp; "target\_amount": 50000.00,

&nbsp; "category": "education",

&nbsp; "image\_url": "https://example.com/image.jpg",

&nbsp; "end\_date": "2025-12-31T23:59:59Z"

}

```



\*\*Response (201):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "Event created successfully",

&nbsp; "data": {

&nbsp;   "id": "uuid",

&nbsp;   "title": "Help Build School",

&nbsp;   "status": "pending",

&nbsp;   "created\_at": "2025-10-24T10:00:00Z"

&nbsp; }

}

```



\### 2.4 Update Event (FR-003)

\*\*PUT\*\* `/events/:id`  

\*\*Auth Required:\*\* Yes (Owner only)



\*\*Request Body:\*\*

```json

{

&nbsp; "title": "Updated Title",

&nbsp; "description": "Updated description",

&nbsp; "target\_amount": 60000.00

}

```



\### 2.5 Delete Event (FR-003)

\*\*DELETE\*\* `/events/:id`  

\*\*Auth Required:\*\* Yes (Owner only)



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "Event deleted successfully"

}

```



\### 2.6 Search Events (FR-013)

\*\*GET\*\* `/events/search?q=school`



---



\## 3. Pledge Endpoints



\### 3.1 Submit Pledge (FR-005)

\*\*POST\*\* `/pledges`  

\*\*Auth Required:\*\* Yes



\*\*Request Body:\*\*

```json

{

&nbsp; "event\_id": "uuid",

&nbsp; "amount": 100.00,

&nbsp; "is\_anonymous": false,

&nbsp; "message": "Happy to support this cause!"

}

```



\*\*Response (201):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "message": "Pledge submitted successfully",

&nbsp; "data": {

&nbsp;   "id": "uuid",

&nbsp;   "amount": 100.00,

&nbsp;   "event\_id": "uuid",

&nbsp;   "created\_at": "2025-10-24T10:00:00Z"

&nbsp; }

}

```



\### 3.2 Get My Pledges (FR-021)

\*\*GET\*\* `/pledges/my`  

\*\*Auth Required:\*\* Yes



\*\*Response (200):\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "id": "uuid",

&nbsp;     "amount": 100.00,

&nbsp;     "is\_anonymous": false,

&nbsp;     "message": "Great cause!",

&nbsp;     "event": {

&nbsp;       "id": "uuid",

&nbsp;       "title": "Help Build School",

&nbsp;       "status": "active"

&nbsp;     },

&nbsp;     "created\_at": "2025-10-24T10:00:00Z"

&nbsp;   }

&nbsp; ]

}

```



\### 3.3 Get Event Pledges (FR-006)

\*\*GET\*\* `/pledges/event/:eventId`



---



\## 4. Admin Endpoints



\### 4.1 Get All Events (FR-011)

\*\*GET\*\* `/admin/events`  

\*\*Auth Required:\*\* Yes (Admin only)



\*\*Response includes pending, active, rejected events\*\*



\### 4.2 Approve Event (FR-012)

\*\*PUT\*\* `/admin/events/:id/approve`  

\*\*Auth Required:\*\* Yes (Admin only)



\### 4.3 Reject Event (FR-012)

\*\*PUT\*\* `/admin/events/:id/reject`  

\*\*Auth Required:\*\* Yes (Admin only)



\*\*Request Body:\*\*

```json

{

&nbsp; "reason": "Insufficient details provided"

}

```



\### 4.4 Generate Reports (FR-014)

\*\*GET\*\* `/admin/reports`  

\*\*Auth Required:\*\* Yes (Admin only)



\*\*Query Parameters:\*\*

\- `type`: daily, weekly, monthly

\- `start\_date`: YYYY-MM-DD

\- `end\_date`: YYYY-MM-DD



---



\## Error Responses



\### 400 Bad Request

```json

{

&nbsp; "success": false,

&nbsp; "message": "Validation failed",

&nbsp; "errors": \[

&nbsp;   {

&nbsp;     "field": "email",

&nbsp;     "message": "Invalid email format"

&nbsp;   }

&nbsp; ]

}

```



\### 401 Unauthorized

```json

{

&nbsp; "success": false,

&nbsp; "message": "No token provided. Please login."

}

```



\### 403 Forbidden

```json

{

&nbsp; "success": false,

&nbsp; "message": "Access denied. Required role: admin"

}

```



\### 404 Not Found

```json

{

&nbsp; "success": false,

&nbsp; "message": "Event not found"

}

```



\### 500 Internal Server Error

```json

{

&nbsp; "success": false,

&nbsp; "message": "Internal server error"

}

```



---



\## Rate Limits



\- \*\*Auth endpoints\*\*: 5 requests per 15 minutes

\- \*\*Pledge submissions\*\*: 20 requests per hour

\- \*\*General API\*\*: 100 requests per 15 minutes



---



\## Postman Collection



Import this collection to test all endpoints:

\[Download Postman Collection](link-to-collection.json)



---



Last Updated: October 24, 2025





