import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import QuestionsPage from "@/pages/QuestionsPage";
import QuestionDetailPage from "@/pages/QuestionDetailPage";
import AskPage from "@/pages/AskPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import BadgesPage from "@/pages/BadgesPage";
import AdminPage from "@/pages/AdminPage";
import BookmarksPage from "@/pages/BookmarksPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import BuyPointsPage from "@/pages/BuyPointsPage";
import ClassesPage from "@/pages/ClassesPage";

setAuthTokenGetter(() => localStorage.getItem("studywave_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/questions" component={QuestionsPage} />
        <Route path="/questions/:id" component={QuestionDetailPage} />
        <Route path="/ask" component={AskPage} />
        <Route path="/profile/:id" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/badges" component={BadgesPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/bookmarks" component={BookmarksPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/buy-points" component={BuyPointsPage} />
        <Route path="/clase" component={ClassesPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
