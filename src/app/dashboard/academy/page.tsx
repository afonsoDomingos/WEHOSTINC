'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BookOpen, Play, Lock, CheckCircle, Clock, DollarSign, Eye, Unlock, ChevronRight, ArrowRight } from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { dataManager, Course, Module, Lesson, CourseProgress, CourseEnrollment } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';
import PageLoader from '@/components/PageLoader';
import Toast from '@/components/Toast';

export default function DashboardAcademyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [progressList, setProgressList] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    // Aguardar NextAuth carregar
    if (status === 'loading') return;
    
    let currentUser: User | null = null;
    
    // Tentar NextAuth primeiro
    if (status === 'authenticated' && session?.user) {
      currentUser = {
        id: (session.user as any)?.id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        plan: (session.user as any)?.plan || 'none',
        status: (session.user as any)?.status || 'active',
        role: (session.user as any)?.role || 'user',
        avatar: session.user.image || undefined,
        dueDate: (session.user as any)?.dueDate,
        createdAt: (session.user as any)?.createdAt || new Date().toISOString()
      };
    }
    
    // Fallback para sistema customizado (se NextAuth falhar ou não estiver autenticado)
    if (!currentUser) {
      currentUser = auth.getCurrentUser();
    }
    
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com') {
      router.push('/admin');
      return;
    }
    loadData(currentUser);
  }, [session, status, router]);

  const loadData = async (currentUser: User) => {
    if (!currentUser) return;

    try {
      await Promise.all([
        dataManager.fetchCoursesAsync(),
        dataManager.fetchModulesAsync(),
        dataManager.fetchLessonsAsync()
      ]);
    } catch (e) {
      console.error('Erro ao buscar dados do servidor, usando dados locais:', e);
    }

    setCourses(dataManager.getCourses().filter(c => c.active));
    setModules(dataManager.getModules());
    setEnrollments(dataManager.getEnrollments(currentUser.email));
    setLoading(false);
  };

  const getCourseProgress = (courseId: string) => {
    const user = auth.getCurrentUser();
    if (!user) return null;
    return progressList.find(p => p.userId === user.email && p.courseId === courseId);
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.courseId === courseId && e.status === 'active');
  };

  const handleEnroll = async (course: Course) => {
    const user = auth.getCurrentUser();
    if (!user) return;

    if (course.accessType === 'paid') {
      // Redirecionar para pagamento (a implementar)
      setToast({ show: true, message: 'Funcionalidade de pagamento em breve', type: 'info' });
      return;
    }

    const enrollment = dataManager.enrollInCourse(user.email, course.id);
    setEnrollments([...enrollments, enrollment]);
    setToast({ show: true, message: 'Inscrição realizada com sucesso!', type: 'success' });
    
    // Redirecionar para o curso após inscrição
    router.push(`/dashboard/academy/course/${course.id}`);
  };

  const handleStartCourse = (courseId: string) => {
    router.push(`/dashboard/academy/course/${courseId}`);
  };

  const handleViewCourse = (course: Course) => {
    router.push(`/dashboard/academy/course/${course.id}`);
  };

  if (loading) return <PageLoader text="A carregar cursos..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BrandLogo />
              <h1 className="text-xl font-bold text-gray-900">Academia Web</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo à Academia Web</h2>
          <p className="text-gray-600">Aprenda a criar páginas de vendas profissionais passo a passo</p>
        </div>

        {/* Enrolled Courses */}
        {enrollments.length > 0 && (
          <section className="mb-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Meus Cursos</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => {
                const course = courses.find(c => c.id === enrollment.courseId);
                if (!course) return null;

                const progress = getCourseProgress(course.id);
                const totalLessons = getTotalLessons(course.id);
                const progressPercent = progress 
                  ? Math.round((progress.completedLessons.length / totalLessons) * 100)
                  : 0;
                const moduleCount = modules.filter(m => m.courseId === course.id).length;

                return (
                  <div key={enrollment.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer" onClick={() => handleStartCourse(course.id)}>
                    {course.thumbnail && (
                      <div className="h-40 bg-gray-100">
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5">
                      <h4 className="font-bold text-gray-900 mb-2">{course.title}</h4>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.shortDescription}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{moduleCount} módulos</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{course.duration}</span>
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progresso</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartCourse(course.id);
                        }}
                        className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition"
                      >
                        <Play className="h-4 w-4" />
                        <span>Continuar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Available Courses */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Cursos Disponíveis</span>
          </h3>
          
          {courses.filter(c => !isEnrolled(c.id)).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Todos os cursos disponíveis</h3>
              <p className="text-gray-600">Você já está inscrito em todos os cursos disponíveis</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter(c => !isEnrolled(c.id)).map((course) => {
                const moduleCount = modules.filter(m => m.courseId === course.id).length;
                
                return (
                  <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                    {course.thumbnail && (
                      <div className="h-40 bg-gray-100">
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold text-gray-900">{course.title}</h4>
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
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.shortDescription}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{course.duration}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{moduleCount} módulos</span>
                        </span>
                      </div>

                      {course.accessType === 'paid' ? (
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                              {course.price?.toLocaleString('pt-MZ')} {course.currency}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <button
                        onClick={() => handleEnroll(course)}
                        className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition"
                      >
                        {course.accessType === 'paid' ? (
                          <>
                            <DollarSign className="h-4 w-4" />
                            <span>Comprar</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4" />
                            <span>Começar Agora</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

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

// Helper functions
function getTotalLessons(courseId: string): number {
  const modules = dataManager.getModules(courseId);
  let total = 0;
  modules.forEach(m => {
    total += dataManager.getLessons(m.id).length;
  });
  return total;
}

function getModuleCount(courseId: string): number {
  return dataManager.getModules(courseId).length;
}
