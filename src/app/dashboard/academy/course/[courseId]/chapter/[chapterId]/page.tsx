'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, CheckCircle, Menu, X, Video, FileText, Clock, Target, Award } from 'lucide-react';
import { auth } from '@/lib/auth';
import { dataManager, Course, Module, Lesson, CourseProgress } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';

export default function ChapterViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
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
    
    // Fetch progress from server
    const serverProgress = await dataManager.fetchCourseProgressAsync(user.email, courseId);
    setProgress(serverProgress);

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

  const getCurrentChapter = () => {
    const chapterIndex = modules.findIndex(m => m.id === currentChapterId);
    if (chapterIndex === -1) {
      return { chapterIndex: -1, module: null };
    }
    return { chapterIndex, module: modules[chapterIndex] };
  };

  const getCurrentLesson = () => {
    const { module } = getCurrentChapter();
    if (!module) return null;
    const moduleLessons = lessons.filter(l => l.moduleId === module.id).sort((a, b) => a.order - b.order);
    return moduleLessons[currentLesson] || null;
  };

  const handleCompleteLesson = () => {
    const currentLessonData = getCurrentLesson();
    if (!currentLessonData || !course) return;

    const user = auth.getCurrentUser();
    if (!user) return;

    const { module } = getCurrentChapter();
    if (!module) return;

    dataManager.updateCourseProgress(user.email, course.id, currentLessonData.id, module.id);
    const updatedProgress = dataManager.getCourseProgress(user.email, course.id);
    setProgress(updatedProgress);

    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);

    setToast({ show: true, message: 'Excelente! Lição concluída com sucesso!', type: 'success' });

    // Move to next lesson
    const moduleLessons = lessons.filter(l => l.moduleId === module.id).sort((a, b) => a.order - b.order);
    if (currentLesson < moduleLessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      // Move to next chapter - use local state instead of navigation
      const { chapterIndex } = getCurrentChapter();
      if (chapterIndex !== -1 && chapterIndex < modules.length - 1) {
        const nextModule = modules[chapterIndex + 1];
        setCurrentChapterId(nextModule.id);
        setCurrentLesson(0);
      }
    }
  };

  const goToPrevious = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    } else {
      const { chapterIndex } = getCurrentChapter();
      if (chapterIndex > 0) {
        const prevModule = modules[chapterIndex - 1];
        const prevModuleLessons = lessons.filter(l => l.moduleId === prevModule.id).sort((a, b) => a.order - b.order);
        setCurrentChapterId(prevModule.id);
        setCurrentLesson(prevModuleLessons.length - 1);
      }
    }
  };

  const goToNext = () => {
    const currentLessonData = getCurrentLesson();
    if (!currentLessonData) return;

    const { module } = getCurrentChapter();
    if (!module) return;

    const moduleLessons = lessons.filter(l => l.moduleId === module.id).sort((a, b) => a.order - b.order);

    if (currentLesson < moduleLessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      const { chapterIndex } = getCurrentChapter();
      if (chapterIndex !== -1 && chapterIndex < modules.length - 1) {
        const nextModule = modules[chapterIndex + 1];
        setCurrentChapterId(nextModule.id);
        setCurrentLesson(0);
      }
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress?.completedLessons.includes(lessonId) || false;
  };

  const getCourseProgress = () => {
    if (!progress || !course) return 0;
    const totalLessons = lessons.filter(l => modules.some(m => m.id === l.moduleId)).length;
    if (totalLessons === 0) return 0;
    return Math.round((progress.completedLessons.length / totalLessons) * 100);
  };

  const getModuleLessons = (moduleId: string) => {
    return lessons.filter(l => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
  };

  if (loading) return <PageLoader text="A carregar capítulo..." />;

  if (!course) return null;

  const { chapterIndex, module: currentModule } = getCurrentChapter();
  const currentLessonData = getCurrentLesson();

  if (!currentModule || chapterIndex === -1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Capítulo não encontrado</h3>
          <p className="text-gray-600 mb-4">O capítulo solicitado não existe ou foi removido.</p>
          <button
            onClick={() => router.push('/dashboard/academy')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Voltar para Academia
          </button>
        </div>
      </div>
    );
  }

  const moduleLessons = getModuleLessons(currentModule.id);
  const completedInModule = moduleLessons.filter(l => isLessonCompleted(l.id)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 text-center animate-in zoom-in-95 duration-300">
            <Award className="h-16 w-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Excelente!</h3>
            <p className="text-gray-600">Lição concluída com sucesso!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
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
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-primary-50 px-3 py-1.5 rounded-full">
                <Target className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-semibold text-primary-700">{getCourseProgress()}%</span>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Capítulo {chapterIndex + 1} de {modules.length}</span>
            </div>
            <div className="text-sm text-gray-600">
              {completedInModule}/{moduleLessons.length} lições concluídas
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(completedInModule / moduleLessons.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Chapters */}
        <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Seu Progresso</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {modules.map((module, index) => {
                const moduleLessons = getModuleLessons(module.id);
                const completedInModule = moduleLessons.filter(l => isLessonCompleted(l.id)).length;
                const isActive = module.id === currentChapterId;
                const isCompleted = completedInModule === moduleLessons.length && moduleLessons.length > 0;

                return (
                  <div key={module.id} className="mb-3">
                    <button
                      onClick={() => {
                        setCurrentChapterId(module.id);
                        setCurrentLesson(0);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        isActive ? 'bg-primary-50 border-2 border-primary-200' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-emerald-100' : isActive ? 'bg-primary-100' : 'bg-gray-100'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : isActive ? (
                            <BookOpen className="h-4 w-4 text-primary-600" />
                          ) : (
                            <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium text-sm ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                            Capítulo {index + 1}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{module.title}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Chapter Header */}
            <div className="mb-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                  Capítulo {chapterIndex + 1}
                </span>
                <span className="text-gray-400">de</span>
                <span>{modules.length}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{currentModule.title}</h2>
              <p className="text-lg text-gray-600 mb-4">{currentModule.description}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Target className="h-4 w-4" />
                <span>Objetivo: {currentModule.objective}</span>
              </div>
            </div>

            {/* Lesson Content */}
            {currentLessonData ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg animate-in slide-in-from-bottom-8 fade-in duration-500">
                <div className="p-6 sm:p-8">
                  {/* Lesson Header */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded font-medium">Lição {currentLesson + 1}</span>
                      <span className="text-gray-400">de</span>
                      <span>{moduleLessons.length}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{currentLessonData.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {currentLessonData.hasVideo && <span className="flex items-center space-x-1"><Video className="h-4 w-4" /><span>Inclui vídeo</span></span>}
                      {currentLessonData.hasMaterial && <span className="flex items-center space-x-1"><FileText className="h-4 w-4" /><span>Material de apoio</span></span>}
                    </div>
                  </div>

                  {/* Video */}
                  {currentLessonData.hasVideo && currentLessonData.videoUrl && (
                    <div className="mb-8">
                      <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-md">
                        <iframe
                          src={currentLessonData.videoUrl}
                          className="w-full h-full"
                          allowFullScreen
                          title={currentLessonData.videoTitle || 'Vídeo da aula'}
                        />
                      </div>
                      {currentLessonData.videoTitle && (
                        <h4 className="font-semibold text-gray-900 mt-3">{currentLessonData.videoTitle}</h4>
                      )}
                      {currentLessonData.videoDescription && (
                        <p className="text-sm text-gray-600 mt-1">{currentLessonData.videoDescription}</p>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-lg max-w-none mb-8">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{currentLessonData.content}</div>
                  </div>

                  {/* Material */}
                  {currentLessonData.hasMaterial && currentLessonData.materialUrl && (
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 mb-8 border border-primary-100">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Material de Apoio</span>
                      </h4>
                      <a
                        href={currentLessonData.materialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {currentLessonData.materialTitle || 'Baixar material'}
                      </a>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={goToPrevious}
                      disabled={chapterIndex === 0 && currentLesson === 0}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition ${
                        chapterIndex === 0 && currentLesson === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                      <span>Anterior</span>
                    </button>

                    <button
                      onClick={handleCompleteLesson}
                      className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition transform hover:scale-105 ${
                        isLessonCompleted(currentLessonData.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
                          : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg shadow-primary-200'
                      }`}
                    >
                      {isLessonCompleted(currentLessonData.id) ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Concluído</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Concluir Lição</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={goToNext}
                      disabled={chapterIndex === modules.length - 1 && currentLesson === moduleLessons.length - 1}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition ${
                        chapterIndex === modules.length - 1 && currentLesson === moduleLessons.length - 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>Próximo</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-lg">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Capítulo vazio</h3>
                <p className="text-gray-600">Este capítulo ainda não tem conteúdo</p>
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
