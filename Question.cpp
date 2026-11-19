#include "Question.h"

#include <stdexcept>
#include <utility>

std::string difficultyName(Difficulty difficulty) {
    switch (difficulty) {
    case Difficulty::Beginner: return "초급";
    case Difficulty::Intermediate: return "중급";
    case Difficulty::Advanced: return "고급";
    }
    throw std::invalid_argument("유효하지 않은 난이도입니다.");
}

Question::Question(int id, Difficulty difficulty, std::string category,
                   std::string text, std::array<std::string, 4> choices,
                   int correctAnswer, std::string explanation)
    : id_(id), difficulty_(difficulty), category_(std::move(category)),
      text_(std::move(text)), choices_(std::move(choices)),
      correctAnswer_(correctAnswer), explanation_(std::move(explanation)) {
    // 잘못된 문제 데이터는 생성 단계에서 발견합니다.
    difficultyName(difficulty_);
    if (id_ <= 0 || correctAnswer_ < 1 || correctAnswer_ > 4 ||
        category_.empty() || text_.empty() || explanation_.empty()) {
        throw std::invalid_argument("문제 데이터가 올바르지 않습니다.");
    }
    for (const auto& choice : choices_) {
        if (choice.empty()) {
            throw std::invalid_argument("보기는 비어 있을 수 없습니다.");
        }
    }
}

int Question::getId() const { return id_; }
Difficulty Question::getDifficulty() const { return difficulty_; }
const std::string& Question::getCategory() const { return category_; }
const std::string& Question::getText() const { return text_; }
const std::array<std::string, 4>& Question::getChoices() const { return choices_; }
int Question::getCorrectAnswer() const { return correctAnswer_; }
const std::string& Question::getExplanation() const { return explanation_; }
bool Question::isCorrect(int answer) const { return answer == correctAnswer_; }
