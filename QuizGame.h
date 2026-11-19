#ifndef CODEMASTER_QUIZGAME_H
#define CODEMASTER_QUIZGAME_H

#include "QuestionBank.h"

#include <cstddef>
#include <optional>
#include <string>
#include <vector>

class QuizGame {
public:
    QuizGame();
    void run();

private:
    static constexpr std::size_t QuestionsPerQuiz = 5;
    static constexpr int PointsPerCorrect = 20;
    static constexpr int XpPerCorrect = 10;
    QuestionBank questionBank_;

    // nullopt는 입력 종료(EOF)를 나타내며, 잘못된 입력과 구분합니다.
    std::optional<int> readInt(const std::string& prompt, int minimum, int maximum) const;
    void showInstructions() const;
    bool playQuiz(Difficulty difficulty);
    void showResults(Difficulty difficulty, const std::vector<Question>& questions,
                     const std::vector<int>& answers) const;
};

#endif
