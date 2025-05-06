import { QuestionType, TestStatus } from '@prisma/client';

export const mathTest = (authorId: number) => {
  return {
    title: 'Математический тест',
    description: 'Простые арифметические операции',
    authorId: authorId,
    code: '12345678',
    status: TestStatus.PUBLISHED,
    showCorrectAnswers: true,
    questions: {
      create: [
        {
          text: 'Сколько будет 2 + 2?',
          type: QuestionType.SINGLE,
          score: 1,
          options: {
            create: [
              { text: '3', isCorrect: false },
              { text: '4', isCorrect: true },
              { text: '5', isCorrect: false },
            ],
          },
        },
        {
          text: 'Выберите все правильные ответы: 3 × 4 =',
          type: QuestionType.MULTIPLE,
          score: 2,
          options: {
            create: [
              { text: '12', isCorrect: true },
              { text: '7', isCorrect: false },
              { text: '3 + 3 + 3 + 3', isCorrect: true },
              { text: '4 + 4 + 4', isCorrect: true },
            ],
          },
        },
        {
          text: 'Решите уравнение: x - 5 = 10',
          type: QuestionType.SINGLE,
          score: 3,
          options: {
            create: [
              { text: '15', isCorrect: true },
              { text: '5', isCorrect: false },
              { text: '10', isCorrect: false },
            ],
          },
        },
        {
          text: 'Чему равен периметр квадрата со стороной 5 см?',
          type: QuestionType.SINGLE,
          score: 1,
          options: {
            create: [
              { text: '10 см', isCorrect: false },
              { text: '20 см', isCorrect: true },
              { text: '25 см', isCorrect: false },
            ],
          },
        },
      ],
    },
  };
};
