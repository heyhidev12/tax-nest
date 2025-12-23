# Admin Authorization Structure

## Overview

This document explains the role-based access control (RBAC) implementation for admin users in the Tax-Nest backend.

## Admin Roles

There are two admin roles defined in `src/libs/enums/admin.enum.ts`:

```typescript
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',  // 최고 관리자 (Super Administrator)
  ADMIN = 'ADMIN',              // 일반 관리자 (Regular Administrator)
}
```

## Authentication vs Authorization

### Authentication (인증)
- **What**: Verifies that the user is who they claim to be
- **How**: JWT token validation via `AdminJwtAuthGuard`
- **Result**: User is authenticated and `req.user` contains: `{ id, loginId, role, permissions }`

### Authorization (권한)
- **What**: Determines what actions an authenticated user can perform
- **How**: Role checking via `RolesGuard` and `@Roles()` decorator
- **Result**: User is authorized (200/201) or forbidden (403)

## JWT Payload Structure

When an admin logs in, the JWT token contains:

```typescript
{
  sub: admin.id,        // Admin user ID
  loginId: admin.loginId,
  role: admin.role,     // 'SUPER_ADMIN' or 'ADMIN'
  type: 'admin'         // Distinguishes from regular user tokens
}
```

## Authorization Rules

### 1. SUPER_ADMIN Access
- ✅ Has access to **ALL** admin endpoints
- ✅ Can manage other admin accounts (create, delete, modify)
- ✅ Can access all content management features
- ✅ Can manage members, consultations, comments, insights, newsletter

### 2. ADMIN Access
- ✅ Can access **MOST** admin endpoints
- ✅ Can manage content (banners, history, awards, branches, etc.)
- ✅ Can manage members
- ✅ Can manage consultations
- ✅ Can manage comments
- ✅ Can manage insights
- ✅ Can manage newsletter subscribers
- ❌ **CANNOT** access admin management endpoints (see below)

## Endpoint Access Matrix

### ✅ Accessible to Both ADMIN and SUPER_ADMIN

| Controller | Base Path | Description |
|------------|-----------|-------------|
| `AdminAuthController` | `/admin/auth` | Login, profile management, password change |
| `AdminContentController` | `/admin/content` | Content management (banners, history, awards, branches, key customers, business areas, training seminars, tax members, columns, data room) |
| `AdminMembersController` | `/admin/members` | Member management |
| `AdminConsultationsController` | `/admin/consultations` | Consultation management |
| `AdminCommentsController` | `/admin/comments` | Comment moderation |
| `AdminInsightsController` | `/admin/insights` | Insights content management |
| `AdminNewsletterController` | `/admin/newsletter` | Newsletter subscriber management |

**Guard Configuration**: `@UseGuards(AdminJwtAuthGuard)` only
- No role restriction
- Any authenticated admin can access

### ❌ SUPER_ADMIN Only Endpoints

| Controller | Endpoint | Method | Description |
|------------|----------|--------|-------------|
| `AdminSettingsController` | `/admin/settings/admins` | GET | List all admin users |
| `AdminSettingsController` | `/admin/settings/admins` | POST | Create new admin user |
| `AdminSettingsController` | `/admin/settings/admins/:id` | DELETE | Delete admin user |
| `AdminSettingsController` | `/admin/settings/admins/:id/toggle-active` | PATCH | Activate/deactivate admin |
| `AdminSettingsController` | `/admin/settings/admins/:id/permissions` | PATCH | Update admin permissions |

**Guard Configuration**: `@UseGuards(AdminJwtAuthGuard, RolesGuard)` + `@Roles(AdminRole.SUPER_ADMIN)`
- Role restriction enforced
- Returns **403 Forbidden** for ADMIN role

## How RolesGuard Works

Located in `src/components/admin-auth/roles.guard.ts`:

```typescript
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access (only JwtAuthGuard is needed)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Ensure user has role property
    if (!user || !user.role) {
      throw new ForbiddenException('권한 정보가 없습니다.');
    }

    // SUPER_ADMIN has access to everything
    if (user.role === AdminRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user's role is in the required roles
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Access denied
    throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
  }
}
```

### Key Points:
1. If no `@Roles()` decorator is present, access is allowed (only authentication required)
2. `SUPER_ADMIN` always has access to everything
3. For other roles, the guard checks if the user's role is in the required roles list
4. If access is denied, returns **403 Forbidden** with Korean error message

## Expected Behavior

### ✅ Correct Behavior

1. **ADMIN Login**:
   - ✅ Can log in successfully
   - ✅ Receives valid JWT token with `role: 'ADMIN'`
   - ✅ Can access `/admin/content/*`, `/admin/members/*`, etc.
   - ❌ Gets **403** when accessing `/admin/settings/admins`
   - **This is EXPECTED and CORRECT**

2. **SUPER_ADMIN Login**:
   - ✅ Can log in successfully
   - ✅ Receives valid JWT token with `role: 'SUPER_ADMIN'`
   - ✅ Can access ALL admin endpoints including `/admin/settings/*`

### ❌ Incorrect Behavior (Frontend Issue)

If a normal ADMIN user is redirected to `/access-denied` when logging in:

1. **Root Cause**: Frontend is calling a SUPER_ADMIN-only endpoint (like `/admin/settings/admins`) immediately after login
2. **Backend Response**: Correctly returns **403 Forbidden**
3. **Frontend Error**: Interprets 403 as "user has no admin access" and redirects to `/access-denied`

**Solution**: Frontend should:
- Check user role from JWT token or `/admin/auth/me` endpoint
- Only call `/admin/settings/*` endpoints if `role === 'SUPER_ADMIN'`
- Hide admin management UI for normal ADMIN users
- NOT redirect to `/access-denied` just because ONE API returns 403

## Anti-Patterns to Avoid

### ❌ DO NOT: Apply role guard at controller level without per-endpoint roles

```typescript
// BAD - This blocks ALL admins from ALL endpoints
@Controller('admin/content')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN)  // ❌ Controller-level role restriction
export class AdminContentController {
  // All endpoints now require SUPER_ADMIN
}
```

### ✅ DO: Apply role guard only where needed

```typescript
// GOOD - Only authentication required for most endpoints
@Controller('admin/content')
@UseGuards(AdminJwtAuthGuard)
export class AdminContentController {
  @Get('banners')
  listBanners() {
    // Accessible to both ADMIN and SUPER_ADMIN
  }
}
```

### ✅ DO: Apply role restrictions per endpoint

```typescript
// GOOD - Role restriction on specific endpoints
@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminSettingsController {
  @Get('admins')
  @Roles(AdminRole.SUPER_ADMIN)  // ✅ Endpoint-level role restriction
  listAdmins() {
    // Only SUPER_ADMIN can access
  }
}
```

## Testing Authorization

### Test 1: ADMIN User Access

```bash
# Login as ADMIN
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin1", "password": "password123"}'

# Response: { "accessToken": "...", "admin": { "role": "ADMIN" } }

# Try to access content (should work)
curl -X GET http://localhost:3000/admin/content/banners \
  -H "Authorization: Bearer <token>"
# Expected: 200 OK

# Try to access admin management (should fail)
curl -X GET http://localhost:3000/admin/settings/admins \
  -H "Authorization: Bearer <token>"
# Expected: 403 Forbidden
```

### Test 2: SUPER_ADMIN User Access

```bash
# Login as SUPER_ADMIN
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId": "superadmin", "password": "admin1234!"}'

# Response: { "accessToken": "...", "admin": { "role": "SUPER_ADMIN" } }

# Try to access content (should work)
curl -X GET http://localhost:3000/admin/content/banners \
  -H "Authorization: Bearer <token>"
# Expected: 200 OK

# Try to access admin management (should work)
curl -X GET http://localhost:3000/admin/settings/admins \
  -H "Authorization: Bearer <token>"
# Expected: 200 OK
```

## Conclusion

The backend authorization is **working correctly**:

1. ✅ JWT payload includes `role` field
2. ✅ `RolesGuard` correctly enforces role-based access
3. ✅ ADMIN users can access most admin features
4. ✅ SUPER_ADMIN users can access everything
5. ✅ Admin management endpoints are restricted to SUPER_ADMIN only

If ADMIN users are being redirected to `/access-denied`, the issue is in the **frontend logic**, not the backend. The frontend should:
- Check the user's role before making API calls
- Handle 403 errors gracefully (hide UI elements, not redirect entire page)
- Only redirect to `/access-denied` if the user is not authenticated, not if they lack permission for a specific action
