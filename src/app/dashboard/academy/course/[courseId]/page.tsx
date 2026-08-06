'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, CheckCircle, Circle, Video, FileText, Lock, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { auth } from '@/lib/auth';
import { dataManager, Course, Module, Lesson, CourseProgress } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';

export default function CourseViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ show: false, message: '', type: 'success' });

  const loadCourseData = useCallback(async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    await Promise.all([
      dataManager.fetchCoursesAsync(),
      dataManager.fetchModulesAsync(),
      dataManager.fetchLessonsAsync()
    ]);

    const courseData = dataManager.getCourses().find(c => c.id === courseId);
    if (!courseData) {
      router.push('/dashboard/academy');
      return;
    }

    setCourse(courseData);
    setModules(dataManager.getModules(courseId).sort((a, b) => a.order - b.order));
    setLessons(dataManager.getLessons());
    setProgress(dataManager.getCourseProgress(user.email, courseId));

    // Auto-expand first module
    const firstModule = dataManager.getModules(courseId).sort((a, b) => a.order - b.order)[0];
    if (firstModule) {
      setExpandedModules(new Set([firstModule.id]));
      const firstLesson = dataManager.getLessons(firstModule.id).sort((a, b) => a.order - b.order)[0];
      if (firstLesson) {
        setSelectedLesson(firstLesson);
      }
    }

    setLoading(false);
  }, [courseId, router]);

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    loadCourseData();
  }, [courseId, router, loadCourseData]);

  const handleCompleteLesson = () => {
    if (!selectedLesson || !course) return;

    const user = auth.getCurrentUser();
    if (!user) return;

    const courseModule = modules.find(m => m.id === selectedLesson.moduleId);
    if (!courseModule) return;

    dataManager.updateCourseProgress(user.email, course.id, selectedLesson.id, courseModule.id);
    const updatedProgress = dataManager.getCourseProgress(user.email, course.id);
    setProgress(updatedProgress);

    setToast({ show: true, message: 'Lição concluída!', type: 'success' });

    // Move to next lesson
    const moduleLessons = lessons.filter(l => l.moduleId === selectedLesson.moduleId).sort((a, b) => a.order - b.order);
    const currentIndex = moduleLessons.findIndex(l => l.id === selectedLesson.id);
    
    if (currentIndex < moduleLessons.length - 1) {
      setSelectedLesson(moduleLessons[currentIndex + 1]);
    } else {
      // Move to next module
      const currentModuleIndex = modules.findIndex(m => m.id === selectedLesson.moduleId);
      if (currentModuleIndex < modules.length - 1) {
        const nextModule = modules[currentModuleIndex + 1];
        const newExpanded = new Set(expandedModules);
        newExpanded.add(nextModule.id);
        setExpandedModules(newExpanded);
        const nextModuleLessons = lessons.filter(l => l.moduleId === nextModule.id).sort((a, b) => a.order - b.order);
        if (nextModuleLessons.length > 0) {
          setSelectedLesson(nextModuleLessons[0]);
        }
      }
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress?.completedLessons.includes(lessonId) || false;
  };

  const getModuleLessons = (moduleId: string) => {
    return lessons.filter(l => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
  };

  const getCourseProgress = () => {
    if (!progress || !course) return 0;
    const totalLessons = lessons.filter(l => modules.some(m => m.id === l.moduleId)).length;
    if (totalLessons === 0) return 0;
    return Math.round((progress.completedLessons.length / totalLessons) * 100);
  };

  if (loading) return <PageLoader text="A carregar curso..." />;

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard/academy')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <BrandLogo />
              <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{getCourseProgress()}%</span> concluído
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Modules */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Conteúdo do Curso</h2>
              </div>
              <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {modules.map((module) => {
                  const moduleLessons = getModuleLessons(module.id);
                  const isExpanded = expandedModules.has(module.id);
                  const completedInModule = moduleLessons.filter(l => isLessonCompleted(l.id)).length;

                  return (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                            <BookOpen className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-gray-900 text-sm">{module.title}</div>
                            <div className="text-xs text-gray-500">{completedInModule}/{moduleLessons.length} lições</div>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 p-2 space-y-1">
                          {moduleLessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLesson(lesson)}
                              className={`w-full p-2 flex items-center space-x-2 rounded-lg text-left transition ${
                                selectedLesson?.id === lesson.id
                                  ? 'bg-primary-50 border border-primary-200'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {isLessonCompleted(lesson.id) ? (
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-300" />
                              )}
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  {lesson.hasVideo && <Video className="h-3 w-3" />}
                                  {lesson.hasMaterial && <FileText className="h-3 w-3" />}
                                </div>
                              </div>
                              {selectedLesson?.id === lesson.id && (
                                <Play className="h-4 w-4 text-primary-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Lesson */}
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedLesson.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {selectedLesson.hasVideo && <span className="flex items-center space-x-1"><Video className="h-4 w-4" /><span>Inclui vídeo</span></span>}
                    {selectedLesson.hasMaterial && <span className="flex items-center space-x-1"><FileText className="h-4 w-4" /><span>Material de apoio</span></span>}
                  </div>
                </div>

                <div className="p-6">
                  {/* Video */}
                  {selectedLesson.hasVideo && selectedLesson.videoUrl && (
                    <div className="mb-6">
                      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <iframe
                          src={selectedLesson.videoUrl}
                          className="w-full h-full"
                          allowFullScreen
                          title={selectedLesson.videoTitle || 'Vídeo da aula'}
                        />
                      </div>
                      {selectedLesson.videoTitle && (
                        <h3 className="font-semibold text-gray-900 mt-2">{selectedLesson.videoTitle}</h3>
                      )}
                      {selectedLesson.videoDescription && (
                        <p className="text-sm text-gray-600 mt-1">{selectedLesson.videoDescription}</p>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-sm max-w-none mb-6">
                    <div className="whitespace-pre-wrap text-gray-700">{selectedLesson.content}</div>
                  </div>

                  {/* Material */}
                  {selectedLesson.hasMaterial && selectedLesson.materialUrl && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Material de Apoio</span>
                      </h4>
                      <a
                        href={selectedLesson.materialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {selectedLesson.materialTitle || 'Baixar material'}
                      </a>
                    </div>
                  )}

                  {/* Complete Button */}
                  <button
                    onClick={handleCompleteLesson}
                    className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition ${
                      isLessonCompleted(selectedLesson.id)
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    {isLessonCompleted(selectedLesson.id) ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Concluído - Próxima Lição</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Marcar como Concluído</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione uma lição</h3>
                <p className="text-gray-600">Escolha uma lição do menu lateral para começar</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
