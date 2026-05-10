// Dropper students (post-12th, repeating year) are stored as grade_level = 13.
// The students.grade_level column is INT8 with no upper bound, so this is safe.
export const DROPPER_GRADE_VALUE = 13;

export const GRADE_OPTIONS = [
  { value: 9, label: "Grade 9" },
  { value: 10, label: "Grade 10" },
  { value: 11, label: "Grade 11" },
  { value: 12, label: "Grade 12" },
  { value: DROPPER_GRADE_VALUE, label: "Dropper" },
];

export function formatGradeLevel(grade) {
  if (grade === null || grade === undefined || grade === "") return "";
  const num = Number(grade);
  if (Number.isNaN(num)) return String(grade);
  if (num === DROPPER_GRADE_VALUE) return "Dropper";
  return `Grade ${num}`;
}

export function isValidStudentGrade(grade) {
  const num = Number(grade);
  return GRADE_OPTIONS.some((opt) => opt.value === num);
}
