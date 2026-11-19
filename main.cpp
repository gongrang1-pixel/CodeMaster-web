#include "QuizGame.h"

#include <exception>
#include <iostream>

int main() {
    // UTF-8 소스는 MSVC의 /utf-8 옵션으로 빌드합니다.
    // Windows 콘솔은 실행 전에 chcp 65001로 UTF-8 출력을 설정합니다.
    // 외부 API 없이 C++17 표준 라이브러리만 사용합니다.
    try {
        QuizGame game;
        game.run();
    } catch (const std::exception& error) {
        std::cerr << "프로그램 오류: " << error.what() << '\n';
        return 1;
    }
    return 0;
}
