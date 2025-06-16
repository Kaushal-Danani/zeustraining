export interface Course {
    title: string;
    subject: string;
    grade: string;
    additionalGrade: string;
    units?: string;
    lessons?: string;
    topics?: string;
    image: string;
    favouriteIcon: string;
    teacherClasses: string[];
    enrollStudents?: string;
    startDate?: string;
    endDate?: string;
    expired?: boolean;
    icons: {
        preview: boolean;
        manageCourse: boolean;
        gradeSubmission: boolean;
        reports: boolean;
    };
}