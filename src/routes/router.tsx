import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import LessonPage from "./LessonPage";
import LevelPage from "./LevelPage";
import TopicPage from "./TopicPage";
import Home from "./Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "levels/:level", element: <LevelPage /> },
      { path: "topic/:topic", element: <TopicPage /> },
      { path: "lesson/:id", element: <LessonPage /> },
    ],
  },
]);
