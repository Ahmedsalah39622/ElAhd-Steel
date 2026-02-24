# نظام حسابات العملاء والموردين

## نظام متكامل لتتبع المستحقات والمدفوعات

---

## 📋 نظرة عامة

نظام محاسبي متكامل لإدارة حسابات العملاء (المستحقات - Receivables) والموردين (المدفوعات - Payables) مع تتبع تفصيلي لجميع المعاملات المالية.

---

## 🎯 المفاهيم الأساسية

### العملاء (Receivables)

- **المبدأ**: العميل يشتري بالآجل → الفاتورة تُسجل كمستحق
- **الدفع**: العميل يدفع → قيد SafeEntry يُسجل كدفعة تخصم من المستحق
- **الرصيد**: `إجمالي الفواتير - (المدفوع على الفواتير + الدفعات المباشرة)`
- **التفسير**:
  - رصيد موجب = العميل مدين (يدين لنا بالمال)
  - رصيد سالب = العميل دائن (له رصيد عندنا)

### الموردين (Payables)

- **المبدأ**: شراء من مورد بالآجل → أمر الشراء يُسجل كمستحق للمورد
- **الدفع**: الدفع للمورد → قيد SafeEntry يُسجل كدفعة تخصم من المستحق
- **الرصيد**: `إجمالي أوامر الشراء - (المدفوع على الأوامر + الدفعات المباشرة)`
- **التفسير**:
  - رصيد موجب = نحن مدينون للمورد (يجب علينا الدفع)
  - رصيد صفر = تمت تسوية جميع المستحقات

---

## 🏗️ البنية التقنية

### قاعدة البيانات

#### 1. نموذج العملاء (Clients)

```javascript
// models/client.js
{
  id: INTEGER,
  name: STRING,
  phone: STRING,
  profile: TEXT,
  budget: DECIMAL,
  material: TEXT (JSON array)
}
```

#### 2. نموذج الموردين (Suppliers)

```javascript
// models/supplier.js
{
  id: INTEGER,
  name: STRING,
  email: STRING,
  phone: STRING,
  address: STRING,
  city: STRING,
  country: STRING,
  bankName: STRING,
  accountNumber: STRING,
  iban: STRING
}
```

#### 3. نموذج الفواتير (Invoices)

```javascript
// models/invoice.js
{
  id: INTEGER,
  number: STRING,
  clientId: INTEGER,
  date: DATE,
  dueDate: DATE,
  items: TEXT (JSON),
  total: DECIMAL,
  status: STRING, // 'draft', 'paid', 'partial', 'unpaid'
  paidAmount: DECIMAL,
  notes: TEXT,
  paymentMethod: STRING,
  bankName: STRING,
  transactionNumber: STRING
}
```

#### 4. نموذج أوامر الشراء (PurchaseOrders)

```javascript
// models/purchaseorder.js
{
  id: INTEGER,
  orderNumber: STRING,
  supplierId: INTEGER,
  materialId: INTEGER,
  weight: DECIMAL,
  price: DECIMAL,
  quantity: INTEGER,
  recipient: STRING,
  totalAmount: DECIMAL,
  paymentStatus: ENUM('paid', 'credit', 'partial'),
  paidAmount: DECIMAL,
  paymentMethod: STRING,
  transactionNumber: STRING,
  status: ENUM('pending', 'completed', 'cancelled'),
  notes: TEXT
}
```

#### 5. نموذج قيود الخزينة (SafeEntry)

```javascript
// models/safeentry.js
{
  id: INTEGER,
  date: DATE,
  description: TEXT,
  customer: STRING,

  // للعملاء (incoming)
  clientId: INTEGER,
  incoming: DECIMAL,
  incomingMethod: STRING,
  incomingTxn: STRING,

  // للموردين (outgoing)
  supplierId: INTEGER,
  outgoing: DECIMAL,
  outgoingMethod: STRING,
  outgoingTxn: STRING,

  entryType: STRING,
  safeId: INTEGER
}
```

---

## 🔌 API Endpoints

### العملاء (Clients)

#### 1. قائمة العملاء مع الأرصدة

```http
GET /api/clients
```

**الاستجابة:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "شركة الأمل",
      "phone": "0123456789",
      "balance": 15000, // الرصيد المستحق
      "hasDebt": true // هل يوجد مستحق؟
    }
  ]
}
```

#### 2. رصيد عميل محدد

```http
GET /api/clients/[id]/balance
```

**الاستجابة:**

```json
{
  "success": true,
  "data": {
    "clientId": 1,
    "clientName": "شركة الأمل",
    "totalInvoices": 50000, // إجمالي الفواتير
    "totalPaid": 35000, // إجمالي المدفوع
    "balance": 15000, // المتبقي
    "hasDebt": true
  }
}
```

#### 3. معاملات عميل محدد

```http
GET /api/clients/[id]/transactions
```

**الاستجابة:**

```json
{
  "success": true,
  "data": {
    "client": {
      "id": 1,
      "name": "شركة الأمل",
      "phone": "0123456789"
    },
    "summary": {
      "totalInvoices": 50000,
      "totalPaid": 35000,
      "balance": 15000,
      "hasDebt": true
    },
    "transactions": [
      {
        "id": "inv-123",
        "type": "invoice",
        "typeLabel": "فاتورة",
        "date": "2026-02-01",
        "description": "فاتورة رقم INV-001",
        "amount": 25000,
        "paidAmount": 10000,
        "status": "partial",
        "reference": "INV-001"
      },
      {
        "id": "pay-456",
        "type": "payment",
        "typeLabel": "دفعة",
        "date": "2026-02-05",
        "description": "دفعة نقدية",
        "amount": 10000,
        "method": "cash",
        "reference": "TXN-789"
      }
    ],
    "invoices": [...],
    "payments": [...]
  }
}
```

---

### الموردين (Suppliers)

#### 1. قائمة الموردين مع الأرصدة

```http
GET /api/suppliers
```

**الاستجابة:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "مورد الحديد",
      "phone": "0123456789",
      "balance": 20000, // المستحق للمورد
      "hasDebt": true
    }
  ]
}
```

#### 2. رصيد مورد محدد

```http
GET /api/suppliers/[id]/balance
```

**الاستجابة:**

```json
{
  "success": true,
  "data": {
    "supplierId": 1,
    "supplierName": "مورد الحديد",
    "totalPurchases": 60000, // إجمالي المشتريات
    "totalPaid": 40000, // إجمالي المدفوع
    "balance": 20000, // المستحق للمورد
    "hasDebt": true
  }
}
```

#### 3. معاملات مورد محدد

```http
GET /api/suppliers/[id]/transactions
```

**الاستجابة:**

```json
{
  "success": true,
  "data": {
    "supplier": {
      "id": 1,
      "name": "مورد الحديد",
      "phone": "0123456789",
      "email": "supplier@example.com"
    },
    "summary": {
      "totalPurchases": 60000,
      "totalPaid": 40000,
      "balance": 20000,
      "hasDebt": true
    },
    "transactions": [
      {
        "id": "po-123",
        "type": "purchase",
        "typeLabel": "أمر شراء",
        "date": "2026-02-01",
        "description": "أمر شراء PO-001 - حديد تسليح",
        "amount": 30000,
        "paidAmount": 15000,
        "paymentStatus": "partial",
        "reference": "PO-001"
      },
      {
        "id": "pay-456",
        "type": "payment",
        "typeLabel": "دفعة",
        "date": "2026-02-05",
        "description": "دفعة للمورد",
        "amount": 15000,
        "method": "bank_transfer",
        "reference": "TXN-789"
      }
    ],
    "purchaseOrders": [...],
    "payments": [...]
  }
}
```

---

## 🖥️ واجهات المستخدم

### 1. صفحة العملاء

**المسار**: `/clients`
**الملف**: `src/app/(dashboard)/clients/page.jsx`

**المميزات**:

- ✅ عرض قائمة جميع العملاء
- ✅ عمود "المستحق" مع تلوين:
  - 🔴 **أحمر** للرصيد الموجب (العميل مدين)
  - 🟢 **أخضر** لعدم وجود مستحقات
- ✅ زر "المعاملات" لعرض التفاصيل
- ✅ إضافة/تعديل/حذف العملاء

**مثال الجدول**:

```
| الاسم        | الهاتف      | الميزانية | المستحق           | الإجراءات |
|-------------|-------------|----------|-------------------|-----------|
| شركة الأمل   | 0123456789  | 100000   | 🔴 15,000 جنيه    | 📄 ✏️ 🗑️  |
| شركة النور   | 0123456788  | 50000    | 🟢 لا يوجد        | 📄 ✏️ 🗑️  |
```

---

### 2. صفحة حساب العميل

**المسار**: `/clients/[id]/account`
**الملف**: `src/app/(dashboard)/clients/[id]/account/page.jsx`

**المحتوى**:

#### أ. ملخص الحساب (Cards)

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ إجمالي الفواتير      │  │ إجمالي المدفوع       │  │ المتبقي              │
│ 🔵 50,000 جنيه       │  │ 🟢 35,000 جنيه       │  │ 🔴 15,000 جنيه       │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

#### ب. جدول جميع المعاملات

```
| التاريخ    | النوع     | الوصف              | المبلغ           | الحالة  |
|-----------|----------|-------------------|-----------------|---------|
| 2026-02-01| 📄 فاتورة| فاتورة رقم INV-001| 🔴 +25,000 جنيه | جزئي    |
| 2026-02-05| 💰 دفعة  | دفعة نقدية         | 🟢 -10,000 جنيه | تم الدفع|
```

#### ج. جدول الفواتير

```
| رقم الفاتورة | التاريخ    | الإجمالي  | المدفوع   | المتبقي   | الحالة |
|-------------|-----------|----------|----------|----------|--------|
| INV-001     | 2026-02-01| 25,000   | 10,000   | 15,000   | جزئي   |
```

#### د. جدول الدفعات

```
| التاريخ    | الوصف        | المبلغ    | طريقة الدفع | رقم المعاملة |
|-----------|-------------|----------|------------ |-------------|
| 2026-02-05| دفعة نقدية   | 10,000   | نقدي        | TXN-789     |
```

---

### 3. صفحة الموردين

**المسار**: `/suppliers`
**الملف**: `src/app/(dashboard)/suppliers/page.jsx`

**المميزات**:

- ✅ عرض قائمة جميع الموردين
- ✅ عمود "المستحق له" مع تلوين:
  - 🔴 **أحمر** للرصيد الموجب (نحن مدينون للمورد)
  - 🟢 **أخضر** لعدم وجود مستحقات
- ✅ زر "المعاملات" لعرض التفاصيل
- ✅ إضافة/تعديل/حذف الموردين

**مثال الجدول**:

```
| الاسم        | الهاتف      | البريد            | المستحق له        | الإجراءات |
|-------------|-------------|------------------|-------------------|-----------|
| مورد الحديد  | 0123456789  | iron@example.com | 🔴 20,000 جنيه    | 📄 ✏️ 🗑️  |
| مورد الخشب   | 0123456788  | wood@example.com | 🟢 لا يوجد        | 📄 ✏️ 🗑️  |
```

---

### 4. صفحة حساب المورد

**المسار**: `/suppliers/[id]/account`
**الملف**: `src/app/(dashboard)/suppliers/[id]/account/page.jsx`

**المحتوى**:

#### أ. ملخص الحساب (Cards)

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ إجمالي المشتريات     │  │ إجمالي المدفوع       │  │ المستحق للمورد       │
│ 🔵 60,000 جنيه       │  │ 🟢 40,000 جنيه       │  │ 🔴 20,000 جنيه       │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

#### ب. جدول جميع المعاملات

```
| التاريخ    | النوع        | الوصف                        | المبلغ           | الحالة  |
|-----------|-------------|------------------------------|-----------------|---------|
| 2026-02-01| 🛒 أمر شراء | أمر شراء PO-001 - حديد تسليح | 🔴 +30,000 جنيه | جزئي    |
| 2026-02-05| 💰 دفعة     | دفعة للمورد                  | 🟢 -15,000 جنيه | تم الدفع|
```

#### ج. جدول أوامر الشراء

```
| رقم الأمر | التاريخ    | المادة       | الإجمالي  | المدفوع   | المتبقي   | الحالة |
|----------|-----------|-------------|----------|----------|----------|--------|
| PO-001   | 2026-02-01| حديد تسليح   | 30,000   | 15,000   | 15,000   | جزئي   |
```

#### د. جدول الدفعات

```
| التاريخ    | الوصف        | المبلغ    | طريقة الدفع   | رقم المعاملة |
|-----------|-------------|----------|--------------|-------------|
| 2026-02-05| دفعة للمورد  | 15,000   | تحويل بنكي    | TXN-789     |
```

---

## 📊 آلية حساب الأرصدة

### للعملاء (Receivables)

```javascript
// في /api/clients
const totalInvoices = await Invoice.sum('total', {
  where: { clientId: id }
})

const totalPaidFromInvoices = await Invoice.sum('paidAmount', {
  where: { clientId: id }
})

const totalPayments = await SafeEntry.sum('incoming', {
  where: { clientId: id }
})

const balance = totalInvoices - totalPaidFromInvoices - totalPayments
```

**مثال عملي**:

- إجمالي الفواتير: 50,000 جنيه
- المدفوع على الفواتير: 20,000 جنيه
- دفعات مباشرة: 15,000 جنيه
- **الرصيد المستحق**: 50,000 - 20,000 - 15,000 = **15,000 جنيه** 🔴

---

### للموردين (Payables)

```javascript
// في /api/suppliers
const totalPurchases = await PurchaseOrder.sum('totalAmount', {
  where: { supplierId: id }
})

const totalPaidFromOrders = await PurchaseOrder.sum('paidAmount', {
  where: { supplierId: id }
})

const totalPayments = await SafeEntry.sum('outgoing', {
  where: { supplierId: id }
})

const balance = totalPurchases - totalPaidFromOrders - totalPayments
```

**مثال عملي**:

- إجمالي أوامر الشراء: 60,000 جنيه
- المدفوع على الأوامر: 25,000 جنيه
- دفعات مباشرة: 15,000 جنيه
- **المستحق للمورد**: 60,000 - 25,000 - 15,000 = **20,000 جنيه** 🔴

---

## 🔄 سيناريوهات الاستخدام

### السيناريو 1: فاتورة آجلة لعميل

**الخطوات**:

1. إنشاء فاتورة بمبلغ 25,000 جنيه

   - `clientId: 1`
   - `total: 25000`
   - `status: 'credit'` أو `'unpaid'`
   - `paidAmount: 0`

2. **النتيجة**:
   - رصيد العميل يزداد بمقدار 25,000 جنيه
   - يظهر باللون الأحمر في صفحة العملاء

---

### السيناريو 2: دفعة من عميل

**الخطوات**:

1. إنشاء قيد SafeEntry

   ```json
   {
     "clientId": 1,
     "incoming": 10000,
     "incomingMethod": "cash",
     "description": "دفعة نقدية",
     "date": "2026-02-05",
     "entryType": "incoming"
   }
   ```

2. **النتيجة**:
   - رصيد العميل ينخفض بمقدار 10,000 جنيه
   - الرصيد الجديد: 25,000 - 10,000 = 15,000 جنيه

---

### السيناريو 3: أمر شراء آجل من مورد

**الخطوات**:

1. إنشاء أمر شراء بمبلغ 30,000 جنيه

   ```json
   {
     "supplierId": 1,
     "materialId": 5,
     "totalAmount": 30000,
     "paymentStatus": "credit",
     "paidAmount": 0
   }
   ```

2. **النتيجة**:
   - رصيد المورد يزداد بمقدار 30,000 جنيه (نحن مدينون له)
   - يظهر باللون الأحمر في صفحة الموردين

---

### السيناريو 4: دفعة لمورد

**الخطوات**:

1. إنشاء قيد SafeEntry

   ```json
   {
     "supplierId": 1,
     "outgoing": 15000,
     "outgoingMethod": "bank_transfer",
     "description": "دفعة للمورد",
     "date": "2026-02-05",
     "entryType": "outgoing"
   }
   ```

2. **النتيجة**:
   - رصيد المورد ينخفض بمقدار 15,000 جنيه
   - الرصيد الجديد: 30,000 - 15,000 = 15,000 جنيه

---

## 🧪 خطة الاختبار

### 1. اختبار العملاء

#### أ. إنشاء فاتورة آجلة

```bash
# الخطوة 1: إنشاء فاتورة
POST /api/invoices
{
  "clientId": 1,
  "total": 25000,
  "status": "credit",
  "paidAmount": 0
}

# الخطوة 2: التحقق من الرصيد
GET /api/clients/1/balance
# المتوقع: balance = 25000, hasDebt = true

# الخطوة 3: التحقق من صفحة العملاء
GET /api/clients
# المتوقع: client.balance = 25000 (أحمر)
```

#### ب. إضافة دفعة

```bash
# الخطوة 1: إنشاء دفعة
POST /api/safe-entries
{
  "clientId": 1,
  "incoming": 10000,
  "incomingMethod": "cash",
  "description": "دفعة نقدية"
}

# الخطوة 2: التحقق من الرصيد
GET /api/clients/1/balance
# المتوقع: balance = 15000

# الخطوة 3: عرض المعاملات
GET /api/clients/1/transactions
# المتوقع: عرض الفاتورة والدفعة
```

---

### 2. اختبار الموردين

#### أ. إنشاء أمر شراء آجل

```bash
# الخطوة 1: إنشاء أمر شراء
POST /api/purchase-orders
{
  "supplierId": 1,
  "materialId": 5,
  "totalAmount": 30000,
  "paymentStatus": "credit",
  "paidAmount": 0
}

# الخطوة 2: التحقق من الرصيد
GET /api/suppliers/1/balance
# المتوقع: balance = 30000, hasDebt = true

# الخطوة 3: التحقق من صفحة الموردين
GET /api/suppliers
# المتوقع: supplier.balance = 30000 (أحمر)
```

#### ب. إضافة دفعة

```bash
# الخطوة 1: إنشاء دفعة
POST /api/safe-entries
{
  "supplierId": 1,
  "outgoing": 15000,
  "outgoingMethod": "bank_transfer",
  "description": "دفعة للمورد"
}

# الخطوة 2: التحقق من الرصيد
GET /api/suppliers/1/balance
# المتوقع: balance = 15000

# الخطوة 3: عرض المعاملات
GET /api/suppliers/1/transactions
# المتوقع: عرض أمر الشراء والدفعة
```

---

## 🎨 الألوان والتلوين

### قواعد التلوين

```javascript
// العملاء (المستحق)
{
  color: client.balance > 0 ? 'error.main' : 'success.main',
  text: client.balance > 0 ? `${client.balance.toLocaleString()} جنيه` : 'لا يوجد'
}

// الموردين (المستحق له)
{
  color: supplier.balance > 0 ? 'error.main' : 'success.main',
  text: supplier.balance > 0 ? `${supplier.balance.toLocaleString()} جنيه` : 'لا يوجد'
}

// الملخص (Summary Cards)
{
  bgcolor: balance > 0 ? 'error.light' : 'success.light',
  color: balance > 0 ? 'error.contrastText' : 'success.contrastText'
}
```

---

## 📁 هيكل الملفات

```
Ahd Steel/
├── migrations/
│   └── 20260208220000-create-purchase-orders.js  ✅
│
├── models/
│   ├── client.js                                  ✅
│   ├── supplier.js                                ✅
│   ├── invoice.js                                 ✅
│   ├── purchaseorder.js                           ✅
│   └── safeentry.js                               ✅
│
├── src/
│   ├── pages/
│   │   └── api/
│   │       ├── clients.js                         ✅ (مع حساب الرصيد)
│   │       ├── clients/
│   │       │   └── [id]/
│   │       │       ├── balance.js                 ✅
│   │       │       └── transactions.js            ✅
│   │       │
│   │       ├── suppliers.js                       ✅ (مع حساب الرصيد)
│   │       ├── suppliers/
│   │       │   └── [id]/
│   │       │       ├── balance.js                 ✅
│   │       │       └── transactions.js            ✅
│   │       │
│   │       ├── invoices.js                        ✅
│   │       └── purchase-orders.js                 ✅
│   │
│   └── app/
│       └── (dashboard)/
│           ├── clients/
│           │   ├── page.jsx                       ✅ (مع عمود المستحق)
│           │   └── [id]/
│           │       └── account/
│           │           └── page.jsx               ✅ (صفحة المعاملات)
│           │
│           └── suppliers/
│               ├── page.jsx                       ✅ (مع عمود المستحق)
│               └── [id]/
│                   └── account/
│                       └── page.jsx               ✅ (صفحة المعاملات)
│
└── docs/
    └── ACCOUNTS_RECEIVABLE_PAYABLE_SYSTEM.md     📄 هذا الملف
```

---

## ✅ حالة التنفيذ

| المكون                      | الحالة   | الملاحظات                                |
| --------------------------- | -------- | ---------------------------------------- |
| نموذج PurchaseOrder         | ✅ مكتمل | يحتوي على paymentStatus و paidAmount     |
| Migration للـ PurchaseOrder | ✅ مكتمل | 20260208220000-create-purchase-orders.js |
| API رصيد العملاء            | ✅ مكتمل | /api/clients/[id]/balance                |
| API معاملات العملاء         | ✅ مكتمل | /api/clients/[id]/transactions           |
| API رصيد الموردين           | ✅ مكتمل | /api/suppliers/[id]/balance              |
| API معاملات الموردين        | ✅ مكتمل | /api/suppliers/[id]/transactions         |
| API قائمة العملاء           | ✅ مكتمل | يحسب الرصيد لكل عميل                     |
| API قائمة الموردين          | ✅ مكتمل | يحسب الرصيد لكل مورد                     |
| صفحة العملاء                | ✅ مكتمل | تعرض عمود المستحق وزر المعاملات          |
| صفحة الموردين               | ✅ مكتمل | تعرض عمود المستحق وزر المعاملات          |
| صفحة حساب العميل            | ✅ مكتمل | عرض تفصيلي للمعاملات                     |
| صفحة حساب المورد            | ✅ مكتمل | عرض تفصيلي للمعاملات                     |

---

## 🚀 كيفية الاستخدام

### 1. تشغيل النظام

```bash
# تثبيت الحزم
pnpm install

# تشغيل Migrations
npx sequelize-cli db:migrate

# تشغيل التطبيق
pnpm dev
```

### 2. الوصول للصفحات

- **العملاء**: `http://localhost:3000/clients`
- **حساب عميل**: `http://localhost:3000/clients/1/account`
- **الموردين**: `http://localhost:3000/suppliers`
- **حساب مورد**: `http://localhost:3000/suppliers/1/account`

---

## 📞 الدعم والتواصل

لأي استفسارات أو مشاكل، يرجى التواصل مع فريق التطوير.

---

**تم التوثيق في**: 8 فبراير 2026
**الإصدار**: 1.0.0
**الحالة**: ✅ النظام مكتمل وجاهز للاستخدام
