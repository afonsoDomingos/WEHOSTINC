'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, BookOpen, Video, FileText, ChevronRight, ChevronDown, Save, X, Lock, Unlock, DollarSign, Eye, Database } from 'lucide-react';
import { auth } from '@/lib/auth';
import { dataManager, Course, Module, Lesson } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { seedAcademyData } from '@/lib/seedAcademy';

export default function AdminAcademyPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'course' | 'module' | 'lesson', id: string } | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    duration: '',
    outcome: '',
    thumbnail: '',
    accessType: 'preview' as 'free' | 'paid' | 'preview',
    price: '',
    currency: 'MZN',
    active: true
  });

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    objective: '',
    active: true
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    hasVideo: false,
    videoUrl: '',
    videoTitle: '',
    videoDescription: '',
    hasMaterial: false,
    materialUrl: '',
    materialTitle: '',
    materialType: 'pdf' as 'pdf' | 'document' | 'link',
    active: true
  });

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      dataManager.fetchCoursesAsync(),
      dataManager.fetchModulesAsync(),
      dataManager.fetchLessonsAsync()
    ]);
    setCourses(dataManager.getCourses());
    setModules(dataManager.getModules());
    setLessons(dataManager.getLessons());
    setLoading(false);
  };

  const handleSaveCourse = () => {
    if (!courseForm.title || !courseForm.description) {
      setToast({ show: true, message: 'Título e descrição são obrigatórios', type: 'error' });
      return;
    }

    const courseData = {
      ...courseForm,
      price: courseForm.accessType === 'paid' ? parseFloat(courseForm.price) : undefined,
      order: courses.length
    };

    if (editingCourse) {
      dataManager.updateCourse(editingCourse.id, courseData);
      setToast({ show: true, message: 'Curso atualizado com sucesso', type: 'success' });
    } else {
      dataManager.createCourse(courseData);
      setToast({ show: true, message: 'Curso criado com sucesso', type: 'success' });
    }

    loadData();
    handleCloseCourseModal();
  };

  const handleSaveModule = () => {
    if (!moduleForm.title || !selectedCourse) {
      setToast({ show: true, message: 'Título é obrigatório', type: 'error' });
      return;
    }

    const moduleData = {
      ...moduleForm,
      courseId: selectedCourse.id,
      order: modules.filter(m => m.courseId === selectedCourse.id).length
    };

    if (editingModule) {
      dataManager.updateModule(editingModule.id, moduleData);
      setToast({ show: true, message: 'Módulo atualizado com sucesso', type: 'success' });
    } else {
      dataManager.createModule(moduleData);
      setToast({ show: true, message: 'Módulo criado com sucesso', type: 'success' });
    }

    loadData();
    handleCloseModuleModal();
  };

  const handleSaveLesson = () => {
    if (!lessonForm.title || !editingModule) {
      setToast({ show: true, message: 'Título é obrigatório', type: 'error' });
      return;
    }

    const lessonData = {
      ...lessonForm,
      moduleId: editingModule.id,
      order: lessons.filter(l => l.moduleId === editingModule.id).length
    };

    if (editingLesson) {
      dataManager.updateLesson(editingLesson.id, lessonData);
      setToast({ show: true, message: 'Lição atualizada com sucesso', type: 'success' });
    } else {
      dataManager.createLesson(lessonData);
      setToast({ show: true, message: 'Lição criada com sucesso', type: 'success' });
    }

    loadData();
    handleCloseLessonModal();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'course') {
      dataManager.deleteCourse(deleteTarget.id);
      setToast({ show: true, message: 'Curso removido com sucesso', type: 'success' });
    } else if (deleteTarget.type === 'module') {
      dataManager.deleteModule(deleteTarget.id);
      setToast({ show: true, message: 'Módulo removido com sucesso', type: 'success' });
    } else if (deleteTarget.type === 'lesson') {
      dataManager.deleteLesson(deleteTarget.id);
      setToast({ show: true, message: 'Lição removida com sucesso', type: 'success' });
    }

    loadData();
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleShowCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        duration: course.duration,
        outcome: course.outcome,
        thumbnail: course.thumbnail || '',
        accessType: course.accessType,
        price: course.price?.toString() || '',
        currency: course.currency || 'MZN',
        active: course.active
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '',
        description: '',
        shortDescription: '',
        duration: '',
        outcome: '',
        thumbnail: '',
        accessType: 'preview',
        price: '',
        currency: 'MZN',
        active: true
      });
    }
    setShowCourseModal(true);
  };

  const handleCloseCourseModal = () => {
    setShowCourseModal(false);
    setEditingCourse(null);
  };

  const handleShowModuleModal = (course: Course, module?: Module) => {
    setSelectedCourse(course);
    if (module) {
      setEditingModule(module);
      setModuleForm({
        title: module.title,
        description: module.description,
        objective: module.objective,
        active: module.active
      });
    } else {
      setEditingModule(null);
      setModuleForm({
        title: '',
        description: '',
        objective: '',
        active: true
      });
    }
    setShowModuleModal(true);
  };

  const handleCloseModuleModal = () => {
    setShowModuleModal(false);
    setEditingModule(null);
    setSelectedCourse(null);
  };

  const handleShowLessonModal = (module: Module, lesson?: Lesson) => {
    setEditingModule(module);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        content: lesson.content,
        hasVideo: lesson.hasVideo,
        videoUrl: lesson.videoUrl || '',
        videoTitle: lesson.videoTitle || '',
        videoDescription: lesson.videoDescription || '',
        hasMaterial: lesson.hasMaterial,
        materialUrl: lesson.materialUrl || '',
        materialTitle: lesson.materialTitle || '',
        materialType: lesson.materialType || 'pdf',
        active: lesson.active
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '',
        content: '',
        hasVideo: false,
        videoUrl: '',
        videoTitle: '',
        videoDescription: '',
        hasMaterial: false,
        materialUrl: '',
        materialTitle: '',
        materialType: 'pdf',
        active: true
      });
    }
    setShowLessonModal(true);
  };

  const handleCloseLessonModal = () => {
    setShowLessonModal(false);
    setEditingLesson(null);
    setEditingModule(null);
  };

  const getCourseModules = (courseId: string) => {
    return modules.filter(m => m.courseId === courseId).sort((a, b) => a.order - b.order);
  };

  const getModuleLessons = (moduleId: string) => {
    return lessons.filter(l => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
  };

  if (loading) return <PageLoader text="A carregar..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BrandLogo />
              <h1 className="text-xl font-bold text-gray-900">Academia Web</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={async () => {
                  try {
                    await seedAcademyData();
                    loadData();
                    setToast({ show: true, message: 'Dados de exemplo carregados com sucesso!', type: 'success' });
                  } catch (error) {
                    console.error('Erro ao carregar dados:', error);
                    setToast({ show: true, message: 'Erro ao carregar dados de exemplo', type: 'error' });
                  }
                }}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Database className="h-5 w-5" />
                <span>Carregar Dados de Exemplo</span>
              </button>
              <button
                onClick={() => handleShowCourseModal()}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="h-5 w-5" />
                <span>Novo Curso</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {courses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum curso encontrado</h3>
            <p className="text-gray-600 mb-4">Comece criando o seu primeiro curso</p>
            <button
              onClick={() => handleShowCourseModal()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Criar Curso
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => {
              const courseModules = getCourseModules(course.id);
              const isExpanded = expandedCourse === course.id;

              return (
                <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Course Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                          {course.accessType === 'paid' && (
                            <span className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                              <DollarSign className="h-3 w-3" />
                              <span>Pago</span>
                            </span>
                          )}
                          {course.accessType === 'free' && (
                            <span className="flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                              <Unlock className="h-3 w-3" />
                              <span>Gratuito</span>
                            </span>
                          )}
                          {course.accessType === 'preview' && (
                            <span className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              <Eye className="h-3 w-3" />
                              <span>Prévia</span>
                            </span>
                          )}
                          {!course.active && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{course.shortDescription}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{courseModules.length} módulos</span>
                          <span>{course.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleShowCourseModal(course)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Editar curso"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ type: 'course', id: course.id });
                            setShowDeleteModal(true);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Remover curso"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modules */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-700">Módulos</h4>
                        <button
                          onClick={() => handleShowModuleModal(course)}
                          className="flex items-center space-x-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Adicionar Módulo</span>
                        </button>
                      </div>

                      {courseModules.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhum módulo criado</p>
                      ) : (
                        <div className="space-y-3">
                          {courseModules.map((module) => {
                            const moduleLessons = getModuleLessons(module.id);
                            const moduleExpanded = expandedCourse === `${course.id}-${module.id}`;

                            return (
                              <div key={module.id} className="bg-white rounded-lg border border-gray-200">
                                <div className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h5 className="font-semibold text-gray-900">{module.title}</h5>
                                        {!module.active && (
                                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">Inativo</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600">{module.objective}</p>
                                      <div className="text-xs text-gray-500 mt-1">{moduleLessons.length} lições</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => setExpandedCourse(moduleExpanded ? null : `${course.id}-${module.id}`)}
                                        className="p-1 hover:bg-gray-100 rounded transition"
                                      >
                                        {moduleExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      </button>
                                      <button
                                        onClick={() => handleShowModuleModal(course, module)}
                                        className="p-1 hover:bg-gray-100 rounded transition"
                                      >
                                        <Edit className="h-4 w-4 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDeleteTarget({ type: 'module', id: module.id });
                                          setShowDeleteModal(true);
                                        }}
                                        className="p-1 hover:bg-red-50 rounded transition"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Lessons */}
                                {moduleExpanded && (
                                  <div className="p-4 pt-0 border-t border-gray-100 mt-3">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-xs font-medium text-gray-600">Lições</span>
                                      <button
                                        onClick={() => handleShowLessonModal(module)}
                                        className="flex items-center space-x-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                                      >
                                        <Plus className="h-3 w-3" />
                                        <span>Adicionar Lição</span>
                                      </button>
                                    </div>

                                    {moduleLessons.length === 0 ? (
                                      <p className="text-xs text-gray-500 text-center py-2">Nenhuma lição criada</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {moduleLessons.map((lesson) => (
                                          <div key={lesson.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center space-x-2">
                                              {lesson.hasVideo && <Video className="h-3 w-3 text-primary-600" />}
                                              {lesson.hasMaterial && <FileText className="h-3 w-3 text-primary-600" />}
                                              <span className="text-sm text-gray-900">{lesson.title}</span>
                                              {!lesson.active && (
                                                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs">Inativo</span>
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <button
                                                onClick={() => handleShowLessonModal(module, lesson)}
                                                className="p-1 hover:bg-gray-200 rounded transition"
                                              >
                                                <Edit className="h-3 w-3 text-gray-600" />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setDeleteTarget({ type: 'lesson', id: lesson.id });
                                                  setShowDeleteModal(true);
                                                }}
                                                className="p-1 hover:bg-red-100 rounded transition"
                                              >
                                                <Trash2 className="h-3 w-3 text-red-600" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCourse ? 'Editar Curso' : 'Novo Curso'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
                <input
                  type="text"
                  value={courseForm.shortDescription}
                  onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Completa *</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                  <input
                    type="text"
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    placeholder="Ex: 8 horas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acesso</label>
                  <select
                    value={courseForm.accessType}
                    onChange={(e) => setCourseForm({ ...courseForm, accessType: e.target.value as 'free' | 'paid' | 'preview' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="free">Gratuito</option>
                    <option value="paid">Pago</option>
                    <option value="preview">Prévia</option>
                  </select>
                </div>
              </div>
              {courseForm.accessType === 'paid' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                    <input
                      type="number"
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moeda</label>
                    <select
                      value={courseForm.currency}
                      onChange={(e) => setCourseForm({ ...courseForm, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="MZN">MZN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resultado Final</label>
                <textarea
                  value={courseForm.outcome}
                  onChange={(e) => setCourseForm({ ...courseForm, outcome: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Thumbnail</label>
                <input
                  type="text"
                  value={courseForm.thumbnail}
                  onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="courseActive"
                  checked={courseForm.active}
                  onChange={(e) => setCourseForm({ ...courseForm, active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="courseActive" className="text-sm text-gray-700">Curso ativo</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseCourseModal}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCourse}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                <textarea
                  value={moduleForm.objective}
                  onChange={(e) => setModuleForm({ ...moduleForm, objective: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="moduleActive"
                  checked={moduleForm.active}
                  onChange={(e) => setModuleForm({ ...moduleForm, active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="moduleActive" className="text-sm text-gray-700">Módulo ativo</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseModuleModal}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveModule}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLesson ? 'Editar Lição' : 'Nova Lição'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="hasVideo"
                    checked={lessonForm.hasVideo}
                    onChange={(e) => setLessonForm({ ...lessonForm, hasVideo: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasVideo" className="text-sm font-medium text-gray-700">Incluir vídeo</label>
                </div>
                {lessonForm.hasVideo && (
                  <div className="space-y-3 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo</label>
                      <input
                        type="text"
                        value={lessonForm.videoUrl}
                        onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título do Vídeo</label>
                      <input
                        type="text"
                        value={lessonForm.videoTitle}
                        onChange={(e) => setLessonForm({ ...lessonForm, videoTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Vídeo</label>
                      <textarea
                        value={lessonForm.videoDescription}
                        onChange={(e) => setLessonForm({ ...lessonForm, videoDescription: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="hasMaterial"
                    checked={lessonForm.hasMaterial}
                    onChange={(e) => setLessonForm({ ...lessonForm, hasMaterial: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasMaterial" className="text-sm font-medium text-gray-700">Incluir material de apoio</label>
                </div>
                {lessonForm.hasMaterial && (
                  <div className="space-y-3 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL do Material</label>
                      <input
                        type="text"
                        value={lessonForm.materialUrl}
                        onChange={(e) => setLessonForm({ ...lessonForm, materialUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título do Material</label>
                      <input
                        type="text"
                        value={lessonForm.materialTitle}
                        onChange={(e) => setLessonForm({ ...lessonForm, materialTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Material</label>
                      <select
                        value={lessonForm.materialType}
                        onChange={(e) => setLessonForm({ ...lessonForm, materialType: e.target.value as 'pdf' | 'document' | 'link' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="pdf">PDF</option>
                        <option value="document">Documento</option>
                        <option value="link">Link</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lessonActive"
                  checked={lessonForm.active}
                  onChange={(e) => setLessonForm({ ...lessonForm, active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="lessonActive" className="text-sm text-gray-700">Lição ativa</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseLessonModal}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLesson}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Confirmar Remoção"
        message="Tem certeza que deseja remover este item? Esta ação não pode ser desfeita."
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
