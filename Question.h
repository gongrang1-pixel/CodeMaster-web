#ifndef CODEMASTER_QUESTION_H
#define CODEMASTER_QUESTION_H

#include <array>
#include <string>

enum class Difficulty { Beginner = 1, Intermediate = 2, Advanced = 3 };
std::string difficultyName(Difficulty difficulty);

// 한 문제의 데이터만 담당합니다. 정답 번호는 화면과 같은 1~4입니다.
class Question {
public:
    Question(int id, Difficulty difficulty, std::string category,
             std::string text, std::array<std::string, 4> choices,
             int correctAnswer, std::string explanation);

    int getId() const;
    Difficulty getDifficulty() const;
    const std::string& getCategory() const;
    const std::string& getText() const;
    const std::array<std::string, 4>& getChoices() const;
    int getCorrectAnswer() const;
    const std::string& getExplanation() const;
    bool isCorrect(int answer) const;

private:
    int id_;
    Difficulty difficulty_;
    std::string category_;
    std::string text_;
    std::array<std::string, 4> choices_;
    int correctAnswer_;
    std::string explanation_;
};

#endif
