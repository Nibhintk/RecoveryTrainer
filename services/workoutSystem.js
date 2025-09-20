const ExerciseAPIService = require("./exerciseService");

class EnhancedWorkoutSystem {
  constructor(baseEngine) {
    this.baseEngine = baseEngine; // Your AI/logic engine
    this.apiService = new ExerciseAPIService();
  }

  async generateEnhancedWorkoutPlan(userProfile) {
    const basePlan = this.baseEngine.generateWorkoutPlan(userProfile);

    const apiExercises = await this.apiService.getRecoveryExercises(
      userProfile.surgeryType,
      userProfile.weeksPostSurgery
    );

    const enhancedPlan = {
      ...basePlan,
      additionalExercises: apiExercises,
      weeklyPlan: await this.enhanceWeeklyPlan(basePlan.weeklyPlan, apiExercises)
    };

    return enhancedPlan;
  }

  async enhanceWeeklyPlan(weeklyPlan, apiExercises) {
    const enhanced = { ...weeklyPlan };

    Object.keys(enhanced).forEach((day, index) => {
      if (apiExercises[index]) {
        enhanced[day].exercises.push({
          name: apiExercises[index].name,
          description: `Target: ${apiExercises[index].target}`,
          duration: "10-15 minutes",
          instructions: apiExercises[index].instructions || [],
          gifUrl: apiExercises[index].gifUrl
        });
      }
    });

    return enhanced;
  }
}

module.exports = EnhancedWorkoutSystem;
