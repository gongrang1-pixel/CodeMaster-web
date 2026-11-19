#include "QuizGame.h"

#include <iomanip>
#include <iostream>
#include <sstream>

QuizGame::QuizGame() = default;

std::optional<int> QuizGame::readInt(const std::string& prompt,
                                     int minimum, int maximum) const {
    while (true) {
        std::cout << prompt << std::flush;
        std::string line;
        if (!std::getline(std::cin, line)) {
            return std::nullopt;
        }

        // 한 줄 전체를 검사하므로 '2abc', '1 2', 빈 줄도 거부합니다.
        std::istringstream input(line);
        int value = 0;
        char extra = '\0';
        if ((input >> value) && !(input >> extra) &&
            value >= minimum && value <= maximum) {
            return value;
        }
        std::cout << "입력 오류: " << minimum << "~" << maximum
                  << " 사이의 정수 하나를 입력하세요.\n";
    }
}

void QuizGame::run() {
    std::cout << "=== CodeMaster: C++ 학습 퀴즈 ===\n";
    while (true) {
        std::cout << "\n[메인 메뉴]\n1. 퀴즈 시작\n2. 프로그램 사용 방법\n3. 종료\n";
        const auto menu = readInt("선택: ", 1, 3);
        if (!menu) {
            std::cout << "\n입력이 종료되어 프로그램을 마칩니다.\n";
            return;
        }
        if (*menu == 3) {
            std::cout << "CodeMaster를 이용해 주셔서 감사합니다!\n";
            return;
        }
        if (*menu == 2) {
            showInstructions();
            continue;
        }

        std::cout << "\n[난이도 선택]\n"
                  << "1. 초급: 변수, 자료형, 연산자, 조건문, 반복문\n"
                  << "2. 중급: 배열, 함수, 참조자, 포인터, 문자열\n"
                  << "3. 고급: 클래스, 객체, 생성자, 상속, 캡슐화, 다형성\n";
        const auto level = readInt("난이도: ", 1, 3);
        if (!level || !playQuiz(static_cast<Difficulty>(*level))) {
            std::cout << "\n입력이 종료되어 프로그램을 마칩니다.\n";
            return;
        }
    }
}

void QuizGame::showInstructions() const {
    std::cout << "\n[프로그램 사용 방법]\n"
              << "1. 퀴즈 시작 후 난이도를 선택합니다.\n"
              << "2. 해당 난이도의 10문제 중 중복 없이 무작위 5문제가 나옵니다.\n"
              << "3. 보기 번호 1~4를 입력하고 Enter를 누릅니다.\n"
              << "4. 정답은 " << PointsPerCorrect << "점과 " << XpPerCorrect
              << "XP, 오답은 0점과 0XP입니다.\n"
              << "5. 퀴즈가 끝나면 결과와 오답 해설을 확인합니다.\n"
              << "점수와 XP는 매 퀴즈마다 새로 계산하며 저장하지 않습니다.\n"
              << "모든 문제는 C++17 기준이며 코드에 필요한 헤더는 포함되어 있다고 가정합니다.\n";
}

bool QuizGame::playQuiz(Difficulty difficulty) {
    const auto questions = questionBank_.selectRandom(difficulty, QuestionsPerQuiz);
    std::vector<int> answers;
    answers.reserve(questions.size());
    std::cout << "\n" << difficultyName(difficulty) << " 퀴즈를 시작합니다!\n"
              << "C++17 기준이며 필요한 표준 헤더는 포함되어 있다고 가정합니다.\n";

    for (std::size_t i = 0; i < questions.size(); ++i) {
        const auto& question = questions[i];
        std::cout << "\n[문제 " << (i + 1) << "/" << questions.size()
                  << "] ID: " << question.getId() << " | " << question.getCategory()
                  << "\n" << question.getText() << "\n";
        const auto& choices = question.getChoices();
        for (std::size_t j = 0; j < choices.size(); ++j) {
            std::cout << (j + 1) << ". " << choices[j] << "\n";
        }
        const auto answer = readInt("답안 (1~4): ", 1, 4);
        if (!answer) {
            std::cout << "\n퀴즈가 중단되었습니다. 미완료 결과는 계산하지 않습니다.\n";
            return false;
        }
        answers.push_back(*answer);
        if (question.isCorrect(*answer)) {
            std::cout << "정답입니다! +" << PointsPerCorrect << "점, +"
                      << XpPerCorrect << "XP\n";
        } else {
            const int correct = question.getCorrectAnswer();
            std::cout << "오답입니다. 정답: " << correct << ". "
                      << choices[static_cast<std::size_t>(correct - 1)] << "\n";
        }
        std::cout << "해설: " << question.getExplanation() << "\n";
    }
    showResults(difficulty, questions, answers);
    return true;
}

void QuizGame::showResults(Difficulty difficulty, const std::vector<Question>& questions,
                           const std::vector<int>& answers) const {
    int correctCount = 0;
    for (std::size_t i = 0; i < questions.size(); ++i) {
        if (questions[i].isCorrect(answers[i])) {
            ++correctCount;
        }
    }
    const int total = static_cast<int>(questions.size());
    const double accuracy = 100.0 * correctCount / total;
    std::cout << "\n===== 퀴즈 결과 =====\n"
              << "선택한 난이도: " << difficultyName(difficulty) << "\n"
              << "정답 개수: " << correctCount << "\n"
              << "오답 개수: " << (total - correctCount) << "\n"
              << "최종 점수: " << correctCount * PointsPerCorrect << "/100점\n"
              << "정답률: " << std::fixed << std::setprecision(1) << accuracy << "%\n"
              << "획득 경험치: " << correctCount * XpPerCorrect << "XP\n"
              << "\n[틀린 문제 복습]\n";
    if (correctCount == total) {
        std::cout << "틀린 문제가 없습니다. 모두 정답입니다!\n";
    }
    for (std::size_t i = 0; i < questions.size(); ++i) {
        const auto& question = questions[i];
        if (question.isCorrect(answers[i])) {
            continue;
        }
        const auto& choices = question.getChoices();
        const int correct = question.getCorrectAnswer();
        std::cout << "\nID: " << question.getId() << " | " << question.getCategory()
                  << "\n" << question.getText()
                  << "\n내 답: " << answers[i] << ". "
                  << choices[static_cast<std::size_t>(answers[i] - 1)]
                  << "\n정답: " << correct << ". "
                  << choices[static_cast<std::size_t>(correct - 1)]
                  << "\n해설: " << question.getExplanation() << "\n";
    }
    std::cout << "\n메인 메뉴로 돌아갑니다.\n";
}
