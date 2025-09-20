// services/exerciseService.js
class ExerciseAPIService {
  constructor() {
    this.exerciseDBKey = process.env.RAPIDAPI_KEY; // ✅ Use env variable
    this.baseURL = 'https://exercisedb.p.rapidapi.com';
  }

  async fetchExercisesByBodyPart(bodyPart) {
    try {
      const response = await fetch(`${this.baseURL}/exercises/bodyPart/${bodyPart}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.exerciseDBKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      });
      const exercises = await response.json();
      return this.filterForRecovery(exercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }
  }

  filterForRecovery(exercises) {
    const recoveryFriendly = ['stretching', 'cardio', 'assisted', 'machine', 'cable'];

    return exercises.filter(exercise => {
      const isLowImpact = recoveryFriendly.some(type =>
        exercise.equipment.toLowerCase().includes(type) ||
        exercise.name.toLowerCase().includes(type)
      );

      const avoidHighRisk = !exercise.name.toLowerCase().includes('heavy') &&
                            !exercise.name.toLowerCase().includes('max') &&
                            !exercise.name.toLowerCase().includes('explosive');

      return isLowImpact && avoidHighRisk;
    });
  }

  async getRecoveryExercises(surgeryType, recoveryWeek) {
    const bodyPartMapping = {
      'knee replacement': 'legs',
      'shoulder surgery': 'shoulders',
      'hip replacement': 'legs',
      'back surgery': 'back'
    };

    const bodyPart = bodyPartMapping[surgeryType] || 'cardio';
    let exercises = await this.fetchExercisesByBodyPart(bodyPart);

    exercises = this.filterByRecoveryWeek(exercises, recoveryWeek);

    return exercises.slice(0, 10);
  }

  filterByRecoveryWeek(exercises, week) {
    if (week <= 2) {
      return exercises.filter(ex =>
        ex.name.toLowerCase().includes('stretch') ||
        ex.name.toLowerCase().includes('gentle') ||
        ex.equipment === 'assisted'
      );
    } else if (week <= 6) {
      return exercises.filter(ex =>
        ex.equipment === 'cable' ||
        ex.equipment === 'resistance band' ||
        ex.name.toLowerCase().includes('light')
      );
    } else {
      return exercises;
    }
  }
}

module.exports = ExerciseAPIService;
