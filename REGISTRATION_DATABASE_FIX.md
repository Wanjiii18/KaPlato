# Registration Database Error Fix

## Issue Identified
```
SQLSTATE[HY000]: General error: 1364 Field 'name' doesn't have a default value
```

The registration was failing because the Laravel backend was trying to insert a karenderia record without setting the required `name` field in the database.

## Root Cause Analysis
1. **Missing Required Field**: The `karenderias` table has a `name` column that doesn't have a default value
2. **Backend Code Gap**: The AuthController was only setting `business_name` but not `name`
3. **Database Schema Mismatch**: The model expected both fields to be populated

## Backend Fixes Applied

### 1. Added Missing `name` Field
**File**: `app/Http/Controllers/AuthController.php`

**Before**:
```php
$karenderia = $user->karenderia()->create([
    'business_name' => $request->business_name,
    // ... other fields
]);
```

**After**:
```php
$karenderia = $user->karenderia()->create([
    'name' => $request->business_name, // Added missing name field
    'business_name' => $request->business_name,
    // ... other fields
]);
```

### 2. Fixed Coordinate Fields
**Before**:
```php
'latitude' => $request->latitude,
'longitude' => $request->longitude,
```

**After**:
```php
'latitude' => $request->latitude ?? null,
'longitude' => $request->longitude ?? null,
```

### 3. Added Email Field Mapping
**Before**:
```php
'business_email' => $request->business_email,
```

**After**:
```php
'email' => $request->business_email ?: $request->email,
'business_email' => $request->business_email,
```

## Database Schema Understanding
The `karenderias` table has both:
- `name`: Display name for the karenderia (required)
- `business_name`: Official business name (required)
- `email`: Contact email (can be business or personal)
- `business_email`: Specific business email (optional)

## Next Steps
1. **Restart Laravel Server**: Apply the backend changes
2. **Test Registration**: Try registering as a karenderia owner again
3. **Verify Database**: Check that records are created with all required fields

## Testing Command
After restarting the server, test with:
```bash
# Navigate to backend directory
cd "d:\lica\school stuff\3rdYear_Summer2025\CAPSTONE 1 (11011)\KaPlato\Capstone\laravel-backend"

# Start Laravel server
php artisan serve --host=127.0.0.1 --port=8000
```

## Expected Result
- ✅ Registration should complete successfully
- ✅ User account created in `users` table
- ✅ Karenderia business record created in `karenderias` table
- ✅ Status set to "pending" for admin approval
- ✅ Success message displayed to user

The registration system should now work properly for both customers and karenderia owners!