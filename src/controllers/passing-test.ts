import { prisma } from '@/server';
import {
  answerQuestionSchema,
  joinTestSchema,
} from '@/validation/test.schemas';
import { AnswerStatus, QuestionType, TestSessionStatus } from '@prisma/client';
import { Request, Response } from 'express';

export const joinTest = async (req: Request, res: Response) => {
  const code = req.params.code;
  const validation = joinTestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  const guestName = validation.data.guestName;

  if (!code) {
    res.status(400).json({ message: 'Code is required' });
    return;
  }

  try {
    const test = await prisma.test.findUnique({
      where: { code: code },
    });

    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }

    const session = await prisma.testSession.create({
      data: {
        testId: test.id,
        userId: req?.user?.id,
        guestName: guestName,
      },
    });

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTestSession = async (req: Request, res: Response) => {
  const sessionUuid = req.params.uuid;

  if (!sessionUuid) {
    res.status(404).json({ message: 'Id must be provided' });
    return;
  }

  try {
    const session = await prisma.testSession.findUnique({
      where: { uuid: sessionUuid },
      include: {
        answers: {
          include: {
            selectedOptions: {
              select: {
                id: true,
                text: true,
                questionId: true,
              },
            },
          },
        },
        test: {
          select: {
            code: true,
            questions: {
              include: {
                options: {
                  select: {
                    id: true,
                    text: true,
                    questionId: true,
                  },
                },
              },
              omit: { createdAt: true, updatedAt: true },
            },
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const answerQuestion = async (req: Request, res: Response) => {
  const validation = answerQuestionSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  try {
    const session = await prisma.testSession.findUnique({
      where: { id: validation.data.testSessionId },
    });

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    const question = await prisma.question.findUnique({
      where: { id: validation.data.questionId },
    });

    if (!question) {
      res.status(404).json({ message: 'Question not found' });
      return;
    }

    await prisma.answer.upsert({
      where: {
        id: validation.data.answerId ?? -1,
      },
      update: {
        selectedOptions: {
          connect: validation.data.selectedOptions,
        },
      },
      create: {
        questionId: validation.data.questionId,
        testSessionId: validation.data.testSessionId,
        selectedOptions: {
          connect: validation.data.selectedOptions,
        },
      },
    });

    res.status(200).json({ message: 'Answer saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendResponseTest = async (req: Request, res: Response) => {
  const uuid = req.params.uuid;

  if (!uuid) {
    res.status(404).json({ message: 'Id must be provided' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const session = await prisma.testSession.findUnique({
        where: { uuid: uuid },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      const testSession = await tx.testSession.update({
        where: { id: session.id },
        data: {
          status: TestSessionStatus.FINISHED,
          endedAt: new Date(),
        },
        include: {
          answers: {
            include: {
              selectedOptions: true,
            },
          },
          test: {
            include: {
              questions: {
                include: {
                  options: true,
                },
              },
            },
          },
        },
      });

      const { test, answers } = testSession;

      let countCorrect = 0;
      let countWrong = 0;
      let countAlmostCorrect = 0;
      let countSkipped = 0;
      let totalScore = 0;

      for (const answer of answers) {
        const question = test?.questions.find(
          (question) => question.id === answer.questionId
        );
        if (!question) continue;

        const selectedOptions = answer.selectedOptions;
        let score = 0;

        selectedOptions.forEach((selectedOption) => {
          const correctOptions = question.options.filter(
            (option) => option.isCorrect
          );
          const isCorrect = correctOptions.find(
            (option) => option.id === selectedOption.id
          );

          if (question.type === QuestionType.MULTIPLE) {
            if (isCorrect) {
              score += question.score / correctOptions.length;
            } else {
              score -= question.score / correctOptions.length;
            }
            score = Math.max(0, score);
          }

          if (question.type === QuestionType.SINGLE) {
            if (isCorrect) {
              score = question.score;
            }
          }

          if (question.type === QuestionType.TEXT) {
            const correctAnswer = question.options.find(
              (option) => option.text === selectedOption.text.trim()
            )
            if (correctAnswer) {
              score = question.score;
            }
          }
        });

        if (score === question.score) countCorrect++;
        else if (score > 0) countAlmostCorrect++;
        else countWrong++;

        totalScore += score;

        await tx.answer.update({
          where: { id: answer.id },
          data: {
            score,
            status:
              score === question.score
                ? AnswerStatus.CORRECT
                : score > 0
                ? AnswerStatus.ALMOST_CORRECT
                : AnswerStatus.INCORRECT,
          },
        });
      }

      if (answers.length <= test?.questions.length) {
        countSkipped = test?.questions.length - answers.length;
      }

      return await tx.testResult.create({
        data: {
          testSessionId: testSession.id,
          countCorrect,
          countWrong,
          countAlmostCorrect,
          countSkipped,
          score: totalScore,
          userId: testSession.userId,
        },
        include: {
          testSession: {
            include: {
              test: {
                include: {
                  questions: {
                    include: {
                      options: true,
                    },
                  },
                },
              },
              answers: {
                include: {
                  selectedOptions: true,
                },
              },
            },
          },
        },
      });
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

export const getTestResult = async (req: Request, res: Response) => {
  const uuid = req.params.uuid;

  if (!uuid) {
    res.status(404).json({ message: 'Id must be provided' });
    return;
  }

  try {
    const result = await prisma.testResult.findFirst({
      where: { testSession: { uuid: uuid } },
      include: {
        testSession: {
          include: {
            test: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
            answers: {
              include: {
                selectedOptions: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      res.status(404).json({ message: 'Result not found' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
