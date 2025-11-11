# 检查用户验证状态

## 查看所有用户状态

```sql
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_sent_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

## 查看特定邮箱用户

```sql
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_sent_at
FROM auth.users
WHERE email = '你的邮箱@example.com';
```

## 查看用户profile信息

```sql
SELECT
  up.id,
  up.display_name,
  up.role,
  u.email_confirmed_at,
  u.email
FROM user_profiles up
LEFT JOIN auth.users u ON up.id = u.id
WHERE u.email = '你的邮箱@example.com';
```

## 手动确认用户邮箱（如果需要）

```sql
-- 方式1：使用UUID
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE id = '用户的UUID';

-- 方式2：使用邮箱
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = '你的邮箱@example.com';
```

## 重置用户密码（如果需要）

```sql
-- 注意：需要通过Supabase Auth API重置，不能直接修改密码hash
-- 这个操作需要通过管理API或用户自助重置
```

## 检查会话表

```sql
SELECT * FROM auth.sessions
WHERE user_id = '用户的UUID'
ORDER BY created_at DESC
LIMIT 5;
```
