# 📦 Posts Module — Community Emergency Platform

## هيكل الملفات

```
src/
├── pages/
│   └── PostsPage.jsx                  ← الصفحة الرئيسية للمقالات
├── components/
│   ├── Posts/
│   │   ├── PostCard.jsx               ← بطاقة المقالة
│   │   ├── PostFilters.jsx            ← فلاتر الترتيب والتصنيف
│   │   ├── CommentsSection.jsx        ← قسم التعليقات
│   │   └── CreatePostModal.jsx        ← مودال نشر مقالة (Trusted فقط)
│   └── Profile/
│       └── ProfileActivity.jsx        ← سجل التعليقات والتفاعلات
├── redux/slices/
│   └── postsSlice.js                  ← Redux slice كامل
└── services/
    └── postsApi.js                    ← API calls
```

## الصلاحيات (مطابقة للـ Backend)

| الإجراء                        | 🌐 Guest | 🔑 Member | ✅ Trusted |
|-------------------------------|----------|-----------|-----------|
| عرض قائمة المقالات            | ✅        | ✅         | ✅         |
| عرض تفاصيل مقالة              | ✅        | ✅         | ✅         |
| عرض التعليقات                 | ✅        | ✅         | ✅         |
| عرض التفاعلات                 | ✅        | ✅         | ✅         |
| إضافة تعليق                   | ❌        | ✅         | ✅         |
| التفاعل (لايك/ديسلايك)        | ❌        | ✅         | ✅         |
| سجل تعليقاتي / تفاعلاتي       | ❌        | ✅         | ✅         |
| نشر مقالة                     | ❌        | ❌         | ✅         |

## كيف يتم تحديد الدور؟

`GET /auth/me` يعيد:
```json
{
  "user": { ... },
  "roles": ["member", "trusted"],
  "permissions": [...]
}
```

في الكود:
```js
const isMember  = !!currentUser;
const isTrusted = currentUser?.roles?.includes('trusted');
```

## استخدام ProfileActivity

```jsx
// في صفحة الملف الشخصي
import ProfileActivity from '../components/Profile/ProfileActivity';

// ضعه داخل صفحة الـ Profile بعد التحقق من تسجيل الدخول
<ProfileActivity />
```

يعرض تبّين:
- **تعليقاتي**: كل التعليقات مع السياق (اسم المقالة)
- **تفاعلاتي**: كل الـ likes/dislikes على المقالات والتعليقات
