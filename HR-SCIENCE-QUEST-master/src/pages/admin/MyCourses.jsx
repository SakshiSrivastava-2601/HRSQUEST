import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getMyCourses } from "../../services/courseService";
import { formatINR } from "../../utils/currency";
import { formatGradeLevel } from "../../utils/grade";
import { 
  BookOpen, 
  PlusCircle, 
  Edit, 
  Eye, 
  Globe, 
  Clock,
  Users,
  IndianRupee,
  GraduationCap,
  Languages,
} from "lucide-react";

export default function TeacherMyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, draft, published
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getMyCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === "draft") return !course.is_published;
    if (filter === "published") return course.is_published;
    return true;
  });

  const getLevelColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
        <AdminSidebar />
        <div className="px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:px-8 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-gray-600 font-medium">Loading Your Courses...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      <AdminSidebar />
      <div className="px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:px-8 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 md:text-3xl mb-2">My Courses</h1>
              <p className="text-gray-600">Manage and create your courses</p>
            </div>
            <Link
              to="/admin/course/create"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl sm:w-auto"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Course
            </Link>
          </div>

          {/* Stats Summary */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                  <div className="text-2xl font-bold text-gray-800">{courses.length}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Published</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {courses.filter(c => c.is_published).length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Drafts</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {courses.filter(c => !c.is_published).length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Students</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {courses.reduce((sum, c) => sum + (c.students_count || 0), 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Courses ({courses.length})
              </button>
              <button
                onClick={() => setFilter("published")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Published ({courses.filter(c => c.is_published).length})
              </button>
              <button
                onClick={() => setFilter("draft")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Drafts ({courses.filter(c => !c.is_published).length})
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Courses Found</h3>
              <p className="text-gray-600 mb-6">
                {filter === "all" 
                  ? "You haven't created any courses yet. Start by creating your first course!"
                  : filter === "published"
                  ? "No published courses yet. Publish a course to make it available to students."
                  : "No draft courses. Create a new course to get started."}
              </p>
              <Link
                to="/admin/course/create"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Course Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-r from-blue-500 to-indigo-600">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white opacity-50" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {course.is_published ? (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                          Published
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-lg">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                      {course.title || "Untitled Course"}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {course.description || "No description provided"}
                    </p>

                    {/* Course Metadata */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        <span>{course.grade_level ? formatGradeLevel(course.grade_level) : "Grade: N/A"}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Languages className="w-4 h-4 mr-2" />
                        <span>Language: {course.language || 'English'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <IndianRupee className="w-4 h-4 mr-2" />
                        <span>Price: {formatINR(course.price || 0)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Updated: {formatDate(course.updated_at)}</span>
                      </div>
                    </div>

                    {/* Level Badge */}
                    <div className="mb-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getLevelColor(course.level)}`}>
                        {course.level || 'Beginner'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/admin/course/${course.course_id}/edit`)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => navigate(`/admin/course/${course.course_id}/edit`)}
                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
