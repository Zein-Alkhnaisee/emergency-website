import { createSlice } from '@reduxjs/toolkit';

// بيانات وهمية للكورسات
const mockCourses = [
    {
        id: '1',
        title: 'الإسعافات الأولية الأساسية',
        description: 'تعلم أساسيات الإسعافات الأولية للحالات الطارئة: الحروق، الجروح، الاختناق، والكسور.',
        platform: 'Udemy',
        platformIcon: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg',
        category: 'إسعافات',
        level: 'مبتدئ',
        duration: '4 ساعات',
        price: 'مجاني',
        rating: 4.8,
        studentsCount: 12450,
        url: 'https://udemy.com/course/first-aid-basics',
        teacher: {
            id: 'teacher1',
            name: 'د. أحمد محمود',
            avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
        },
        addedBy: 'teacher1',
        createdAt: '2025-04-01',
        certificateRequired: false,
        isReported: false,
    },
    {
        id: '2',
        title: 'التعامل مع الحرائق في المنزل',
        description: 'كيفية الوقاية من الحرائق، استخدام طفايات الحريق، وإجراءات الإخلاء الآمن.',
        platform: 'Coursera',
        platformIcon: 'https://about.coursera.org/app/themes/coursera/assets/images/coursera-logo.svg',
        category: 'سلامة',
        level: 'متوسط',
        duration: '6 ساعات',
        price: '50$',
        rating: 4.9,
        studentsCount: 8750,
        url: 'https://coursera.org/course/fire-safety',
        teacher: {
            id: 'teacher2',
            name: 'مهندس خالد رشيد',
            avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
        },
        addedBy: 'teacher2',
        createdAt: '2025-04-15',
        certificateRequired: true,
        isReported: false,
    },
    {
        id: '3',
        title: 'الإنعاش القلبي الرئوي (CPR)',
        description: 'دورة متكاملة لتعلم الإنعاش القلبي الرئوي للبالغين والأطفال والرضع، مع شهادة معتمدة.',
        platform: 'Edraak',
        platformIcon: 'https://www.edraak.org/static/images/logo.png',
        category: 'إسعافات',
        level: 'متقدم',
        duration: '8 ساعات',
        price: 'مجاني',
        rating: 4.7,
        studentsCount: 32100,
        url: 'https://edraak.org/course/cpr',
        teacher: {
            id: 'teacher1',
            name: 'د. أحمد محمود',
            avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
        },
        addedBy: 'teacher1',
        createdAt: '2025-05-01',
        certificateRequired: true,
        isReported: false,
    },
    {
        id: '4',
        title: 'الإسعاف النفسي الأولي',
        description: 'كيفية تقديم الدعم النفسي للمتضررين من الصدمات والحوادث.',
        platform: 'Coursera',
        platformIcon: 'https://about.coursera.org/app/themes/coursera/assets/images/coursera-logo.svg',
        category: 'نفسي',
        level: 'مبتدئ',
        duration: '5 ساعات',
        price: 'مجاني',
        rating: 4.6,
        studentsCount: 5400,
        url: 'https://coursera.org/course/psychological-first-aid',
        teacher: {
            id: 'teacher3',
            name: 'د. سامية إبراهيم',
            avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
        },
        addedBy: 'teacher3',
        createdAt: '2025-04-20',
        certificateRequired: false,
        isReported: false,
    },
];

// طلبات التقديم ليصبح معلم
const mockTeacherRequests = [
    {
        id: 'req1',
        userId: 'user456',
        userName: 'محمد علي',
        userAvatar: 'https://randomuser.me/api/portraits/men/44.jpg',
        qualifications: 'مدرب معتمد في الإسعافات الأولية، خبرة 5 سنوات',
        documents: ['doc1.pdf', 'certificate.jpg'],
        status: 'pending', // pending, approved, rejected
        createdAt: '2025-05-10',
    },
];

const coursesSlice = createSlice({
    name: 'courses',
    initialState: {
        courses: mockCourses,
        teacherRequests: mockTeacherRequests,
        userCertificates: [], // الشهادات التي رفعها المستخدم
        filter: 'all', // all, category
        category: 'all',
        loading: false,
    },
    reducers: {
        setCourses: (state, action) => { state.courses = action.payload; },
        addCourse: (state, action) => { state.courses.unshift(action.payload); },
        removeCourse: (state, action) => { state.courses = state.courses.filter(c => c.id !== action.payload); },
        reportCourse: (state, action) => {
            const course = state.courses.find(c => c.id === action.payload);
            if (course) course.isReported = true;
        },
        addTeacherRequest: (state, action) => { state.teacherRequests.unshift(action.payload); },
        updateTeacherRequestStatus: (state, action) => {
            const { id, status } = action.payload;
            const req = state.teacherRequests.find(r => r.id === id);
            if (req) req.status = status;
        },
        addCertificate: (state, action) => { state.userCertificates.push(action.payload); },
        setFilter: (state, action) => { state.filter = action.payload; },
        setCategory: (state, action) => { state.category = action.payload; },
    },
});

export const {
    setCourses, addCourse, removeCourse, reportCourse,
    addTeacherRequest, updateTeacherRequestStatus, addCertificate,
    setFilter, setCategory,
} = coursesSlice.actions;
export default coursesSlice.reducer;