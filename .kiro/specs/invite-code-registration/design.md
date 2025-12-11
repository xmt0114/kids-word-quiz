# 邀请码注册功能设计文档

## 概述

本设计文档描述了邀请码注册功能的实现方案。该功能将在现有的登录系统基础上添加用户自主注册能力，通过邀请码验证机制确保只有授权用户可以注册。系统将复用现有的UI组件和状态管理模式，确保与现有系统的一致性和可维护性。

## 架构

### 组件架构
```
src/components/auth/
├── LoginModal.tsx (现有，需要修改)
└── RegisterModal.tsx (新增)

src/hooks/
└── useAuth.ts (现有，需要扩展)

src/stores/slices/
└── uiSlice.ts (现有，需要扩展)
```

### 数据流架构
```
用户交互 → RegisterModal → useAuth.signUp → Supabase Edge Function → 用户反馈
                ↓
            UISlice (状态管理)
```

## 组件和接口

### RegisterModal 组件

**接口定义:**
```typescript
interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface RegisterFormData {
  email: string;
  password: string;
  displayName: string;
  inviteCode: string;
}
```

**主要功能:**
- 渲染注册表单（邮箱、密码、昵称、邀请码）
- 表单验证和错误处理
- 调用注册API
- 提供登录切换功能

### useAuth Hook 扩展

**新增方法:**
```typescript
interface AuthHookExtension {
  signUp: (formData: RegisterFormData) => Promise<AuthResult>;
}

interface AuthResult {
  success: boolean;
  error?: string;
}
```

### UISlice 状态管理扩展

**新增状态:**
```typescript
interface UISliceExtension {
  registerModal: {
    isOpen: boolean;
  };
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
}
```

## 数据模型

### 注册表单数据模型
```typescript
interface RegisterFormData {
  email: string;          // 用户邮箱，必填，格式验证
  password: string;       // 用户密码，必填，最少6位
  displayName: string;    // 用户昵称，必填，2-20字符
  inviteCode: string;     // 邀请码，必填，格式待定
}
```

### 表单验证规则
- **邮箱**: 标准邮箱格式验证
- **密码**: 最少6个字符，包含字母和数字
- **昵称**: 2-20个字符，不能为空或纯空格
- **邀请码**: 非空字符串，具体格式由后端验证

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在编写正确性属性之前，我需要识别和消除冗余：

**冗余分析:**
- 属性1.3和2.5都涉及表单验证，可以合并为一个综合的表单验证属性
- 属性5.3、5.4、5.5都涉及模态框切换行为，可以合并为一个模态框切换属性
- 属性1.4和2.2都涉及API调用和错误处理，可以合并为一个API交互属性

**合并后的属性:**

**属性 1: 表单验证完整性**
*对于任何* 注册表单输入组合，当输入无效时（邮箱格式错误、密码过短、昵称为空、邀请码为空），系统应该阻止提交并显示相应的验证错误消息
**验证需求: 1.3, 2.5**

**属性 2: API交互正确性**
*对于任何* 有效的注册表单数据，系统应该调用user-signup Edge Function，并根据响应正确处理成功或错误状态
**验证需求: 1.4, 2.2**

**属性 3: 模态框切换一致性**
*对于任何* 模态框切换操作（登录到注册或注册到登录），系统应该关闭当前模态框、打开目标模态框、清空表单数据并清除错误消息
**验证需求: 5.3, 5.4, 5.5**

## 错误处理

### 客户端验证错误
- 邮箱格式错误: "请输入有效的邮箱地址"
- 密码过短: "密码至少需要6个字符"
- 昵称为空: "请输入昵称"
- 邀请码为空: "请输入邀请码"

### 服务端错误处理
- 邀请码无效: 显示后端返回的具体错误消息
- 邮箱已存在: "该邮箱已被注册"
- 网络错误: "网络连接失败，请重试"
- 其他错误: 显示后端返回的错误消息或通用错误提示

### 错误显示策略
- 使用与登录模态框相同的错误提示样式
- 错误消息显示在表单顶部的红色背景区域
- 表单字段验证错误实时显示在对应字段下方

## 测试策略

### 单元测试
- RegisterModal组件渲染测试
- 表单验证逻辑测试
- useAuth.signUp方法测试
- UISlice状态管理测试

### 属性基础测试
使用 **fast-check** 库进行属性基础测试，每个测试运行最少100次迭代：

**属性测试 1: 表单验证完整性**
- 生成随机的有效和无效表单数据
- 验证无效数据被正确拒绝
- 验证错误消息正确显示
- **功能: invite-code-registration, 属性 1: 表单验证完整性**

**属性测试 2: API交互正确性**
- 生成随机的有效注册数据
- 模拟不同的API响应（成功、失败）
- 验证系统正确处理各种响应
- **功能: invite-code-registration, 属性 2: API交互正确性**

**属性测试 3: 模态框切换一致性**
- 生成随机的模态框状态和表单数据
- 验证切换操作的一致性
- 验证数据清理的完整性
- **功能: invite-code-registration, 属性 3: 模态框切换一致性**

### 集成测试
- 完整注册流程测试
- 登录注册切换测试
- 错误场景端到端测试

### 测试工具配置
- **属性基础测试库**: fast-check
- **最小迭代次数**: 100次
- **测试框架**: Jest + React Testing Library
- **模拟工具**: MSW (Mock Service Worker) 用于API模拟