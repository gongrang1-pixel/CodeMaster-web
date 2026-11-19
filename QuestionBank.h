#ifndef CODEMASTER_QUESTIONBANK_H
#define CODEMASTER_QUESTIONBANK_H

#include "Question.h"

#include <cstddef>
#include <random>
#include <vector>

class QuestionBank {
public:
    QuestionBank();
    std::vector<Question> getByDifficulty(Difficulty difficulty) const;
    std::vector<Question> selectRandom(Difficulty difficulty, std::size_t count);

private:
    std::vector<Question> questions_;
    std::mt19937 randomEngine_;
    void loadQuestions();
    void validateQuestions() const;
};

#endif
