import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { createCourse } from "../../services/courseService";
import { getSubjects } from "../../services/subjectService";
import { showSuccessPopup, showValidationPopup } from "../../services/notify";
import { formatINR } from "../../utils/currency";
import { GRADE_OPTIONS, isValidStudentGrade } from "../../utils/grade";
import {
  BookOpen,
  Save,
  X,
  Upload,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

export default function TeacherCreateCourse() {
  const navigate = useNavigate();
  const thumbnailInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject_id: "",
    grade_level: "",
    price: "",
    level: "beginner",
    language: "english",
    thumbnail_url: "",
  });
  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]);

  const levels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "Hindi" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
  ];

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data || []);
      } catch (error) {
        console.error("Error loading subjects:", error);
      }
    };

    loadSubjects();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Course title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Course description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!formData.subject_id) {
      newErrors.subject_id = "Please select a subject";
    }

    if (!formData.grade_level) {
      newErrors.grade_level = "Grade level is required";
    } else if (!isValidStudentGrade(formData.grade_level)) {
      newErrors.grade_level = "Select Grade 9–12 or Dropper";
    }

    if (formData.price < 0) {
      newErrors.price = "Price cannot be negative";
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleThumbnailButtonClick = () => {
    thumbnailInputRef.current?.click();
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type);
    if (!isValidType) {
      showValidationPopup("Please upload a JPG, PNG, WEBP, or GIF image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showValidationPopup("Thumbnail image size must be under 2MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        thumbnail_url: String(reader.result || ""),
      }));
      showSuccessPopup("Thumbnail uploaded successfully.");
    };
    reader.onerror = () => {
      showValidationPopup("Unable to read the selected image. Please try another file.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors).find(Boolean);
      if (firstError) {
        showValidationPopup(firstError);
      }
      return;
    }

    setLoading(true);

    try {
      const courseData = {
        ...formData,
        subject_id: parseInt(formData.subject_id),
        grade_level: parseInt(formData.grade_level),
        price: parseFloat(formData.price) || 0,
      };

      const response = await createCourse(courseData);

      navigate(`/admin/course/${response.course_id}/edit`, {
        state: { message: "Course created successfully!" },
      });
    } catch (error) {
      console.error("Error creating course:", error);
      setErrors({
        submit: "Failed to create course. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-auto px-4 pt-24 pb-8 md:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-sm">
            <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <button
                  onClick={() => navigate("/admin/courses")}
                  className="mb-4 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to My Courses
                </button>
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  Create New Course
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                  Set up a polished course foundation with the right title, grade,
                  subject, pricing, and presentation before you start adding lessons.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Flow</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">Draft Setup</div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Audience</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">Students</div>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:col-span-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">Ready to Create</div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.72fr)]">
            <div>
              <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-5 shadow-xl md:p-8">
                <div className="mb-8">
                  <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
                    <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                    Basic Information
                  </h2>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Course Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Complete Mathematics Course for Grade 10"
                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 ${
                          errors.title ? "border-red-500" : "border-gray-300"
                        } text-sm transition-colors focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.title && (
                        <p className="mt-1.5 flex items-center text-sm text-red-600">
                          <HelpCircle className="mr-1 h-4 w-4" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Course Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Describe what students will learn in this course..."
                        className={`w-full resize-none rounded-xl border bg-gray-50 px-4 py-3 ${
                          errors.description ? "border-red-500" : "border-gray-300"
                        } text-sm transition-colors focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.description && (
                        <p className="mt-1.5 flex items-center text-sm text-red-600">
                          <HelpCircle className="mr-1 h-4 w-4" />
                          {errors.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.description.length} / 20 minimum characters
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="subject_id"
                          value={formData.subject_id}
                          onChange={handleChange}
                          className={`w-full rounded-xl border bg-gray-50 px-4 py-3 ${
                            errors.subject_id ? "border-red-500" : "border-gray-300"
                          } text-sm transition-colors focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Select a subject</option>
                          {subjects.map((subject) => (
                            <option key={subject.subject_id} value={subject.subject_id}>
                              {subject.subject_name}
                            </option>
                          ))}
                        </select>
                        {errors.subject_id && (
                          <p className="mt-1.5 text-sm text-red-600">{errors.subject_id}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Grade Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="grade_level"
                          value={formData.grade_level}
                          onChange={handleChange}
                          className={`w-full rounded-xl border bg-gray-50 px-4 py-3 ${
                            errors.grade_level ? "border-red-500" : "border-gray-300"
                          } text-sm transition-colors focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Select Grade</option>
                          {GRADE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {errors.grade_level && (
                          <p className="mt-1.5 text-sm text-red-600">{errors.grade_level}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Difficulty Level
                        </label>
                        <select
                          name="level"
                          value={formData.level}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {levels.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Language
                        </label>
                        <select
                          name="language"
                          value={formData.language}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Price (Rs.)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 ${
                          errors.price ? "border-red-500" : "border-gray-300"
                        } text-sm transition-colors focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.price && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.price}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Leave as 0 for free course. Current value: {formatINR(formData.price || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-semibold text-gray-800">Course Thumbnail</h2>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Thumbnail URL
                    </label>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="url"
                        name="thumbnail_url"
                        value={formData.thumbnail_url}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleThumbnailButtonClick}
                        className="flex items-center justify-center rounded-xl bg-gray-100 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
                        title="Upload thumbnail image"
                      >
                        <Upload className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Paste an image URL or upload JPG, PNG, WEBP, or GIF up to 2MB.
                    </p>
                  </div>

                  {formData.thumbnail_url && (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">Preview:</p>
                      <div className="mx-auto max-w-md overflow-hidden rounded-xl">
                        <img
                          src={formData.thumbnail_url}
                          alt="Thumbnail preview"
                          className="h-40 w-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x200?text=Invalid+Image+URL";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {errors.submit && (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">{errors.submit}</p>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/courses")}
                    className="flex w-full items-center justify-center rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 font-medium text-white shadow-md transition-all duration-200 hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Course
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-gray-900">Publishing Checklist</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    Choose a clear title that matches the target grade.
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    Keep the description specific so students know outcomes.
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3">
                    Match subject, level, and price before saving.
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-5 shadow-sm md:p-6">
                <h3 className="flex items-center text-lg font-semibold text-gray-900">
                  <HelpCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Tips for a better course
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                  <li className="rounded-2xl bg-white/70 px-4 py-3">
                    Use a thumbnail that feels clean, bright, and topic-specific.
                  </li>
                  <li className="rounded-2xl bg-white/70 px-4 py-3">
                    Set the right difficulty so students can discover the course easily.
                  </li>
                  <li className="rounded-2xl bg-white/70 px-4 py-3">
                    After creation, continue in edit mode to add sections and lessons.
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
