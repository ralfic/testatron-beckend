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
    const session = await prisma.testSession.findUnique({
      where: { uuid: uuid },
    });

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const testSession = await tx.testSession.update({
        where: { id: session.id },
        data: {
          status: TestSessionStatus.FINISHED,
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
      let countAlmost = 0;
      let countSkipped = 0;
      let totalScore = 0;

      answers.forEach(async (answer) => {
        let score = 0;
        const question = test?.questions.find(
          (question) => question.id === answer.questionId
        );

        const selectedOptions = answer.selectedOptions;

        if (selectedOptions.length === 0) {
          countSkipped = countSkipped + 1;
          await tx.answer.update({
            where: { id: answer.id },
            data: {
              score: 0,
              status: AnswerStatus.SKIPPED,
            },
          });
          return;
        }

        selectedOptions.forEach((selectedOption) => {
          if (!question) {
            return;
          }

          const correctOptions = question.options.filter(
            (option) => option.isCorrect
          );

          if (question.type === QuestionType.MULTIPLE) {
            if (
              correctOptions.find((option) => option.id === selectedOption.id)
            ) {
              score += question.score / correctOptions.length;
            } else {
              score -= score === 0 ? 0 : question.score / correctOptions.length;
            }
          }

          if (question.type === QuestionType.SINGLE) {
            if (
              correctOptions.find((option) => option.id === selectedOption.id)
            ) {
              score += question.score;
            }
          }
        });

        if (score === question?.score) {
          countCorrect = countCorrect + 1;
        } else if (score > 0) {
          countAlmost = countAlmost + 1;
        } else {
          countWrong = countWrong + 1;
        }

        totalScore += score;

        await tx.answer.update({
          where: { id: answer.id },
          data: {
            score: score,
            status:
              score === question?.score
                ? AnswerStatus.CORRECT
                : score > 0
                ? AnswerStatus.ALMOST_CORRECT
                : AnswerStatus.INCORRECT,
          },
        });
      });

      return await tx.testResult.create({
        data: {
          testSessionId: testSession.id,
          countCorrect: countCorrect,
          countWrong: countWrong,
          countAlmostCorrect: countAlmost,
          countSkipped: countSkipped,
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
    res.status(500).json({ message: 'Internal server error' });
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
