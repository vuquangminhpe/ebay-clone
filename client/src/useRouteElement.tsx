/* eslint-disable react-refresh/only-export-components */
import { useContext } from 'react'
import { AppContext } from './Contexts/app.context'
import { Navigate, Outlet, useRoutes } from 'react-router-dom'
import path from './constants/path'
import RegisterLayout from './layout/RegisterLayout'
import Login from './pages/User/Login'
import Register from './pages/User/Register'
import MainLayout from './layout/MainLayout'
import UserLayout from './layout/UserLayout'
import Profile from './pages/User/Profile'
import ChangePassword from './pages/User/ChangePassword'
import VerifyEmail from './pages/User/VerifyEmail'
import ForgotPassword from './pages/User/ForgotPassword'
import VerifyForgotToken from './pages/User/VerifyForgotToken'
import ResetPassword from './pages/User/ResetPassword'
import Chat from './pages/User/ChatUser'
import Home from './components/Home'
import OAuthCallback from './components/Customs/OAuthCallback'
import Story from './pages/User/Story/StoryList'
import SearchPage from './pages/User/SearchPage/SearchPage'
import SubscriptionPage from './pages/User/Subscription'
import PaymentResultPage from './pages/User/Payment/PaymentResultPage'
import PaymentHistoryPage from './pages/User/Payment/PaymentHistoryPage'
import PaymentDetailPage from './pages/User/Payment/PaymentDetailPage'
import StoriesPage from './pages/User/HomeSection/StoriesPage/StoriesPage'
import StoryCreator from './pages/User/HomeSection/StoryCreator/StoryCreator'
import StoryArchiveViewer from './pages/User/HomeSection/StoryArchiveViewer'
import Bookmarks from './pages/User/BookMark'
import WhoToFollow from './pages/User/WhoToFollow'
import FollowingList from './pages/User/HomeSection/FollowingList'
import UserManagement from './pages/Admin/Users/UserManagement'
import RevenueStatistics from './pages/Admin/Statistics/RevenueStatistics/RevenueStatistics'
import ContentStatistics from './pages/Admin/Statistics/ContentStatistics'
import UserStatistics from './pages/Admin/Statistics'
import AdminDashboard from './pages/Admin/Dashboard'
import ContentModeration from './pages/Admin/Moderation'
import ReportGeneration from './pages/Admin/Reports'
import InteractionStatistics from './pages/Admin/Statistics/InteractionStatistics'
import AdminLayout from './layout/AdminLayout/AdminLayout'
function ProtectedRoute() {
  const { isAuthenticated } = useContext(AppContext)
  return isAuthenticated ? <Outlet /> : <Navigate to={path.login} />
}

function RejectedRoute() {
  const { isAuthenticated } = useContext(AppContext)
  return !isAuthenticated ? <Outlet /> : <Navigate to={path.home} />
}

export default function useRouteElement() {
  const profile = useContext(AppContext).profile
  const routeElements = useRoutes([
    {
      path: path.admin,
      element: <ProtectedRoute />,
      children: [
        {
          path: '',
          element: <AdminLayout />,
          children: [
            {
              path: '',
              element: <Navigate to={path.adminDashboard} />
            },
            {
              path: path.dashboard,
              element: <AdminDashboard />
            },
            {
              path: path.statistics_user,
              element: <UserStatistics />
            },
            {
              path: path.statistics_content,
              element: <ContentStatistics />
            },
            {
              path: path.statistics_interaction,
              element: <InteractionStatistics />
            },
            {
              path: path.statistics_revenue,
              element: <RevenueStatistics />
            },
            {
              path: path.users,
              element: <UserManagement />
            },
            {
              path: path.moderation_reported,
              element: <ContentModeration />
            },
            {
              path: path.moderation_generate,
              element: <ReportGeneration />
            }
          ]
        }
      ]
    },
    {
      path: path.asHome,
      element: <Navigate to={path.home} />
    },
    {
      path: path.home,
      element: <Home />
    },
    {
      path: path.auth,
      element: <RejectedRoute />,
      children: [
        {
          path: path.login,
          element: (
            <RegisterLayout>
              <Login />
            </RegisterLayout>
          )
        },
        {
          path: path.register,
          element: (
            <RegisterLayout>
              <Register />
            </RegisterLayout>
          )
        }
      ]
    },
    {
      path: path.user,
      element: <ProtectedRoute />,
      children: [
        {
          path: path.no,
          element: (
            <MainLayout>
              <UserLayout />
            </MainLayout>
          ),
          children: [
            {
              path: path.profile,
              element: <Profile />
            },
            {
              path: path.changePassword,
              element: <ChangePassword />
            },
            {
              path: path.verifyEmail,
              element: <VerifyEmail />
            }
          ]
        },
        {
          path: path.chat,
          element: <Chat />
        },
        {
          path: 'story',
          element: <StoriesPage />
        },
        {
          path: 'story/:id',
          element: <StoriesPage />
        },
        {
          path: 'story/create',
          element: <StoryCreator onClose={() => window.history.back()} />
        },
        {
          path: 'story/archive',
          element: <StoryArchiveViewer userId={profile?._id || ''} onClose={() => window.history.back()} />
        },
        {
          path: path.story,
          element: <Story />
        },
        {
          path: path.search,
          element: <SearchPage />
        },
        {
          path: 'payment/result',
          element: <PaymentResultPage />
        },
        {
          path: 'payment/history',
          element: <PaymentHistoryPage />
        },
        {
          path: 'payment/detail/:orderId',
          element: <PaymentDetailPage />
        },
        {
          path: 'subscription',
          element: <SubscriptionPage />
        }
      ]
    },
    {
      path: path.forgotPassword,
      element: <ForgotPassword />
    },
    {
      path: path.verifyForgotPassword,
      element: <VerifyForgotToken />
    },
    {
      path: path.resetPassword,
      element: <ResetPassword />
    },
    {
      path: path.googleLogin,
      element: <OAuthCallback />
    },
    {
      path: path.bookmark,
      element: <Bookmarks />
    },
    {
      path: path.whoToFollow,
      element: <WhoToFollow />
    },
    {
      path: path.followingList,
      element: <FollowingList profile={profile} />
    },

    {
      path: path.any,
      element: <Navigate to={path.home} />
    }
  ])
  return routeElements
}
