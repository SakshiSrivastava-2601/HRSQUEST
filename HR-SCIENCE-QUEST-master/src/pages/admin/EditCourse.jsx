import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFullCourse,
  updateCourse,
  publishCourse,
  createSection,
  updateSection,
  getSections,
  createLecture,
  getLectures,
  addResource,
  updateResource,
  deleteResource,
  getResources
} from "../../services/courseService";
import { uploadLessonMaterial, uploadLessonVideo } from "../../services/lmsService";
import { resolveApiUrl } from "../../services/api";
import { formatINR } from "../../utils/currency";
import { GRADE_OPTIONS } from "../../utils/grade";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  Save,
  Plus,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  Link as LinkIcon,
  Download,
  Globe,
  Edit,
  Trash2,
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function TeacherEditCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState("content"); // content, settings, resources
  const [expandedSections, setExpandedSections] = useState({});
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [lectures, setLectures] = useState({});
  const [resources, setResources] = useState({});
  const [courseMessage, setCourseMessage] = useState("");
  const [courseError, setCourseError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject_id: "",
    grade_level: "",
    price: "",
    level: "beginner",
    language: "english",
    thumbnail_url: ""
  });

  // Section Form
  const [sectionForm, setSectionForm] = useState({
    title: "",
    order_index: 0
  });

  // Lecture Form
  const [lectureForm, setLectureForm] = useState({
    title: "",
    description: "",
    video_url: "",
    notes: "",
    file: null,
    order_index: 0,
    is_preview: false,
    video_duration_seconds: 0
  });

  // Resource Form
  const [resourceForm, setResourceForm] = useState({
    resource_title: "",
    resource_type: "pdf",
    file_url: "",
    file_size_kb: 0,
    file: null
  });

  useEffect(() => {
    fetchFullCourse();
  }, [courseId]);

  const fetchFullCourse = async () => {
    try {
      setLoading(true);
      setCourseError("");
      const courseData = await getFullCourse(courseId);
      setCourse(courseData);
      
      // Populate form data
      setFormData({
        title: courseData.title || "",
        description: courseData.description || "",
        subject_id: courseData.subject_id || "",
        grade_level: courseData.grade_level || "",
        price: courseData.price || 0,
        level: courseData.level || "beginner",
        language: courseData.language || "english",
        thumbnail_url: courseData.thumbnail_url || ""
      });

      // Fetch sections
      const sectionsData = await getSections(courseId);
      setSections(sectionsData);
      
      // Initialize expanded sections
      const expanded = {};
      sectionsData.forEach((section, index) => {
        expanded[section.section_id] = index === 0; // Expand first section by default
      });
      setExpandedSections(expanded);

      // Fetch lectures for each section
      const lecturesData = {};
      for (const section of sectionsData) {
        const sectionLectures = await getLectures(courseId, section.section_id);
        lecturesData[section.section_id] = sectionLectures;
        
        // Fetch resources for each lecture
        for (const lecture of sectionLectures) {
          const lectureResources = await getResources(lecture.lecture_id);
          setResources(prev => ({
            ...prev,
            [lecture.lecture_id]: lectureResources
          }));
        }
      }
      setLectures(lecturesData);
      
    } catch (error) {
      console.error("Error fetching course:", error);
      setCourseError(error.message || "Failed to fetch course");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleUpdateCourse = async () => {
    try {
      setSaving(true);
      setCourseMessage("");
      setCourseError("");
      await updateCourse(courseId, formData);
      setCourseMessage("Course settings updated successfully.");
    } catch (error) {
      console.error("Error updating course:", error);
      setCourseError(error.message || "Error updating course");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishCourse = async () => {
    try {
      setPublishing(true);
      setCourseMessage("");
      setCourseError("");
      await publishCourse(courseId);
      setCourse(prev => ({ ...prev, is_published: true }));
      setCourseMessage("Course published successfully.");
    } catch (error) {
      console.error("Error publishing course:", error);
      setCourseError(error.message || "Error publishing course");
    } finally {
      setPublishing(false);
    }
  };

  const closeSectionModal = () => {
    setShowSectionModal(false);
    setEditingSection(null);
    setSectionForm({ title: "", order_index: 0 });
  };

  const openCreateSectionModal = () => {
    setEditingSection(null);
    setSectionForm({
      title: "",
      order_index: sections.length
    });
    setShowSectionModal(true);
  };

  const openEditSectionModal = (section) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title || "",
      order_index: section.order_index ?? 0
    });
    setShowSectionModal(true);
  };

  const handleSaveSection = async () => {
    try {
      setCourseMessage("");
      setCourseError("");
      const payload = {
        course_id: parseInt(courseId, 10),
        title: sectionForm.title,
        order_index:
          sectionForm.order_index === "" || sectionForm.order_index === null
            ? 0
            : parseInt(sectionForm.order_index, 10) || 0
      };

      if (editingSection) {
        await updateSection({
          ...payload,
          section_id: editingSection.section_id
        });
        setCourseMessage("Section updated successfully.");
      } else {
        await createSection(payload);
        setCourseMessage("Section created successfully.");
      }

      closeSectionModal();
      await fetchFullCourse();
    } catch (error) {
      console.error("Error saving section:", error);
      setCourseError(error.message || "Error saving section");
    }
  };

  const handleCreateLecture = async () => {
    try {
      setCourseMessage("");
      setCourseError("");

      if (lectureForm.file) {
        await uploadLessonVideo({
          course_id: parseInt(courseId),
          section_id: selectedSection.section_id,
          lesson_title: lectureForm.title,
          description: lectureForm.description,
          notes: lectureForm.notes,
          order_index: (lectures[selectedSection.section_id] || []).length,
          is_preview: lectureForm.is_preview,
          video_duration_seconds: parseInt(lectureForm.video_duration_seconds) || 0,
          file: lectureForm.file,
        });
      } else {
        await createLecture({
          course_id: parseInt(courseId),
          section_id: selectedSection.section_id,
          title: lectureForm.title,
          description: lectureForm.description,
          video_url: lectureForm.video_url,
          notes: lectureForm.notes,
          order_index: (lectures[selectedSection.section_id] || []).length,
          is_preview: lectureForm.is_preview,
          video_duration_seconds: parseInt(lectureForm.video_duration_seconds) || 0
        });
      }
      
      setShowLectureModal(false);
      setLectureForm({
        title: "",
        description: "",
        video_url: "",
        notes: "",
        file: null,
        order_index: 0,
        is_preview: false,
        video_duration_seconds: 0
      });
      setCourseMessage("Lecture created successfully.");
      await fetchFullCourse();
    } catch (error) {
      console.error("Error creating lecture:", error);
      setCourseError(error.message || "Error creating lecture");
    }
  };

  const handleAddResource = async () => {
    try {
      setCourseMessage("");
      setCourseError("");

      if (!editingResource && resourceForm.file) {
        await uploadLessonMaterial({
          course_id: parseInt(courseId),
          lesson_id: selectedLecture.lecture_id,
          resource_title: resourceForm.resource_title,
          resource_type: resourceForm.resource_type,
          file: resourceForm.file,
        });
      } else if (editingResource) {
        await updateResource({
          resource_id: editingResource.resource_id,
          lecture_id: selectedLecture.lecture_id,
          resource_title: resourceForm.resource_title,
          resource_type: resourceForm.resource_type,
          file_url: resourceForm.file_url,
          file_size_kb: parseInt(resourceForm.file_size_kb) || 0
        });
      } else {
        await addResource({
          lecture_id: selectedLecture.lecture_id,
          resource_title: resourceForm.resource_title,
          resource_type: resourceForm.resource_type,
          file_url: resourceForm.file_url,
          file_size_kb: parseInt(resourceForm.file_size_kb) || 0
        });
      }
      
      closeResourceModal();
      setCourseMessage(editingResource ? "Resource updated successfully." : "Resource added successfully.");
      await fetchFullCourse();
    } catch (error) {
      console.error("Error saving resource:", error);
      setCourseError(error.message || "Error saving resource");
    }
  };

  const closeResourceModal = () => {
    setShowResourceModal(false);
    setSelectedLecture(null);
    setEditingResource(null);
    setResourceForm({
      resource_title: "",
      resource_type: "pdf",
      file_url: "",
      file_size_kb: 0,
      file: null
    });
  };

  const openAddResourceModal = (lecture) => {
    setSelectedLecture(lecture);
    setEditingResource(null);
    setResourceForm({
      resource_title: "",
      resource_type: "pdf",
      file_url: "",
      file_size_kb: 0,
      file: null
    });
    setShowResourceModal(true);
  };

  const openEditResourceModal = (lecture, resource) => {
    setSelectedLecture(lecture);
    setEditingResource(resource);
    setResourceForm({
      resource_title: resource.resource_title || "",
      resource_type: resource.resource_type || "pdf",
      file_url: resource.file_url || "",
      file_size_kb: resource.file_size_kb || 0,
      file: null
    });
    setShowResourceModal(true);
  };

  const handleDeleteResource = async (resource) => {
    const confirmed = window.confirm(`Delete resource "${resource.resource_title}"?`);
    if (!confirmed) return;

    try {
      setCourseMessage("");
      setCourseError("");
      await deleteResource(resource.resource_id);
      setCourseMessage("Resource deleted successfully.");
      if (editingResource?.resource_id === resource.resource_id) {
        closeResourceModal();
      }
      await fetchFullCourse();
    } catch (error) {
      console.error("Error deleting resource:", error);
      setCourseError(error.message || "Error deleting resource");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-gray-600 font-medium">Loading Course...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex overflow-x-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-auto pt-24 lg:ml-64 lg:pt-0">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white shadow-lg border-b border-gray-200">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/admin/courses")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{formData.title || "Untitled Course"}</h1>
                  <p className="text-sm text-gray-500">Course ID: {courseId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {course?.is_published ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Published
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Draft
                  </span>
                )}
                
                <button
                  onClick={handleUpdateCourse}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </button>
                
                {!course?.is_published && (
                  <button
                    onClick={handlePublishCourse}
                    disabled={publishing}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    {publishing ? "Publishing..." : "Publish Course"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {courseMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {courseMessage}
              </div>
            )}
            {courseError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {courseError}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-lg p-1 mb-6 inline-flex">
              <button
                onClick={() => setActiveTab("content")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "content" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Course Content
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "settings" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab("resources")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "resources" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Resources
              </button>
            </div>

            {activeTab === "content" && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                {/* Add Section Button */}
                <div className="mb-6">
                  <button
                    onClick={openCreateSectionModal}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </button>
                </div>

                {/* Sections List */}
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div key={section.section_id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Section Header */}
                      <div
                        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleSection(section.section_id)}
                      >
                        <div className="flex items-center space-x-3">
                          {expandedSections[section.section_id] ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-800">{section.title}</h3>
                            <p className="text-sm text-gray-500">
                              {(lectures[section.section_id] || []).length} lectures
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSection(section);
                              setShowLectureModal(true);
                            }}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSectionModal(section);
                            }}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Lectures */}
                      {expandedSections[section.section_id] && (
                        <div className="p-4 space-y-3">
                          {(lectures[section.section_id] || []).length === 0 ? (
                            <div className="text-center py-8">
                              <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500">No lectures yet</p>
                              <button
                                onClick={() => {
                                  setSelectedSection(section);
                                  setShowLectureModal(true);
                                }}
                                className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Add your first lecture
                              </button>
                            </div>
                          ) : (
                            lectures[section.section_id].map((lecture, idx) => (
                              <div key={lecture.lecture_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <PlayCircle className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <h4 className="font-medium text-gray-800">{lecture.title}</h4>
                                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                                        <span>
                                          {Math.floor(lecture.video_duration_seconds / 60)}:
                                          {(lecture.video_duration_seconds % 60).toString().padStart(2, '0')}
                                        </span>
                                        {lecture.is_preview && (
                                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                            Preview
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => {
                                        openAddResourceModal(lecture);
                                      }}
                                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="Add Resource"
                                    >
                                      <FileText className="w-4 h-4 text-green-600" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                      <Edit className="w-4 h-4 text-gray-600" />
                                    </button>
                                  </div>
                                </div>

                                {/* Resources */}
                                {resources[lecture.lecture_id] && resources[lecture.lecture_id].length > 0 && (
                                  <div className="mt-3 ml-8 space-y-2">
                                    {resources[lecture.lecture_id].map((resource, ridx) => (
                                      <div key={ridx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          {resource.resource_type === 'pdf' ? (
                                            <FileText className="w-4 h-4 text-red-500" />
                                          ) : (
                                            <LinkIcon className="w-4 h-4 text-blue-500" />
                                          )}
                                          <span className="text-sm text-gray-700">{resource.resource_title}</span>
                                          <span className="text-xs text-gray-500">
                                            {(resource.file_size_kb / 1024).toFixed(1)} MB
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => openEditResourceModal(lecture, resource)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                            title="Edit Resource"
                                          >
                                            <Edit className="w-4 h-4 text-gray-600" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteResource(resource)}
                                            className="p-1 hover:bg-red-100 rounded"
                                            title="Delete Resource"
                                          >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                          </button>
                                          <a
                                            href={resolveApiUrl(resource.file_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 hover:bg-gray-200 rounded"
                                          >
                                            <Download className="w-4 h-4 text-gray-600" />
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Course Settings</h2>
                
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="4"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Subject and Grade Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject ID</label>
                      <input
                        type="number"
                        value={formData.subject_id}
                        onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                      <select
                        value={formData.grade_level}
                        onChange={(e) => setFormData({...formData, grade_level: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Grade</option>
                        {GRADE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price and Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (Rs.)</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Current value: {formatINR(formData.price || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  {/* Language and Thumbnail */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <input
                        type="text"
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL</label>
                      <input
                        type="url"
                        value={formData.thumbnail_url}
                        onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-6">
                    <button
                      onClick={handleUpdateCourse}
                      disabled={saving}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "resources" && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">All Course Resources</h2>
                
                <div className="space-y-6">
                  {sections.map(section => (
                    <div key={section.section_id}>
                      <h3 className="font-bold text-gray-800 mb-3">{section.title}</h3>
                      
                      {(lectures[section.section_id] || []).map(lecture => (
                        resources[lecture.lecture_id] && resources[lecture.lecture_id].length > 0 && (
                          <div key={lecture.lecture_id} className="mb-4 ml-6">
                            <h4 className="font-medium text-gray-700 mb-2">{lecture.title}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {resources[lecture.lecture_id].map((resource, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-center space-x-3">
                                    {resource.resource_type === 'pdf' ? (
                                      <FileText className="w-5 h-5 text-red-500" />
                                    ) : (
                                      <LinkIcon className="w-5 h-5 text-blue-500" />
                                    )}
                                    <div>
                                      <p className="font-medium text-gray-800">{resource.resource_title}</p>
                                      <p className="text-xs text-gray-500">
                                        {(resource.file_size_kb / 1024).toFixed(1)} MB • {resource.resource_type.toUpperCase()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => openEditResourceModal(lecture, resource)}
                                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                      title="Edit Resource"
                                    >
                                      <Edit className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteResource(resource)}
                                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                      title="Delete Resource"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                    <a
                                      href={resolveApiUrl(resource.file_url)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                      <Download className="w-4 h-4 text-gray-600" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingSection ? "Edit Section" : "Add New Section"}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                  <input
                    type="text"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm({...sectionForm, title: e.target.value})}
                    placeholder="e.g., Introduction"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Order</label>
                  <input
                    type="number"
                    min="0"
                    value={sectionForm.order_index}
                    onChange={(e) => setSectionForm({...sectionForm, order_index: e.target.value})}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeSectionModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSection}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                >
                  {editingSection ? "Update Section" : "Create Section"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lecture Modal */}
      {showLectureModal && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-fadeIn">
            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 sm:text-xl">
                    Add Lecture to {selectedSection.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add video, notes, preview access, and lesson timing in one place.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLectureModal(false);
                    setSelectedSection(null);
                  }}
                  className="self-start rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lecture Title</label>
                  <input
                    type="text"
                    value={lectureForm.title}
                    onChange={(e) => setLectureForm({...lectureForm, title: e.target.value})}
                    placeholder="e.g., Introduction to the Course"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
                  <input
                    type="number"
                    value={lectureForm.video_duration_seconds}
                    onChange={(e) => setLectureForm({...lectureForm, video_duration_seconds: e.target.value})}
                    placeholder="300"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={lectureForm.description}
                    onChange={(e) => setLectureForm({...lectureForm, description: e.target.value})}
                    placeholder="Describe what this lesson covers"
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                  <input
                    type="url"
                    value={lectureForm.video_url}
                    onChange={(e) => setLectureForm({...lectureForm, video_url: e.target.value})}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Use this for YouTube, Vimeo, or already-hosted lesson videos.</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload Video File</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    onChange={(e) => setLectureForm({...lectureForm, file: e.target.files?.[0] || null})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Supported: MP4, WebM, MOV, MKV. Secure upload endpoint will be used.</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Notes</label>
                  <textarea
                    value={lectureForm.notes}
                    onChange={(e) => setLectureForm({...lectureForm, notes: e.target.value})}
                    placeholder="Add lesson notes, key takeaways, or written explanation for students"
                    rows="5"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Students will see these notes directly inside the lesson viewer.</p>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="is_preview"
                      checked={lectureForm.is_preview}
                      onChange={(e) => setLectureForm({...lectureForm, is_preview: e.target.checked})}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_preview" className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-800">Make this lecture available as preview</span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Students can view this lecture before purchasing the full course.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setShowLectureModal(false);
                    setSelectedSection(null);
                  }}
                  className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLecture}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-600 hover:to-indigo-600 sm:w-auto"
                >
                  Create Lecture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && selectedLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingResource ? "Edit Resource" : "Add Resource to Lecture"}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resource Title</label>
                  <input
                    type="text"
                    value={resourceForm.resource_title}
                    onChange={(e) => setResourceForm({...resourceForm, resource_title: e.target.value})}
                    placeholder="e.g., Course Notes PDF"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                  <select
                    value={resourceForm.resource_type}
                    onChange={(e) => setResourceForm({...resourceForm, resource_type: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="ppt">PowerPoint</option>
                    <option value="doc">Word Document</option>
                    <option value="link">External Link</option>
                    <option value="zip">Zip File</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File URL</label>
                  <input
                    type="url"
                    value={resourceForm.file_url}
                    onChange={(e) => setResourceForm({...resourceForm, file_url: e.target.value})}
                    placeholder="https://example.com/file.pdf"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Use this for external documents only.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File Size (KB)</label>
                  <input
                    type="number"
                    value={resourceForm.file_size_kb}
                    onChange={(e) => setResourceForm({...resourceForm, file_size_kb: e.target.value})}
                    placeholder="1024"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingResource ? "Upload Replacement Not Required" : "Or Upload Material File"}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip"
                    onChange={(e) => setResourceForm({...resourceForm, file: e.target.files?.[0] || null})}
                    disabled={Boolean(editingResource)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {editingResource
                      ? "For existing uploaded resources, you can update title, type, and link details here."
                      : "PDF, docs, slides, text, and zip files are supported."}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeResourceModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddResource}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                >
                  {editingResource ? "Update Resource" : "Add Resource"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
