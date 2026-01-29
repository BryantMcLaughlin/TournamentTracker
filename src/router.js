import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/:tournamentId?",
    name: "tracker",
    component: {
      template: "<div></div>",
    },
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
