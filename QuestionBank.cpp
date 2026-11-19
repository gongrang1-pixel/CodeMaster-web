#include "QuestionBank.h"

#include <algorithm>
#include <set>
#include <stdexcept>

QuestionBank::QuestionBank() : randomEngine_(std::random_device{}()) {
    loadQuestions();
    validateQuestions();
}

std::vector<Question> QuestionBank::getByDifficulty(Difficulty difficulty) const {
    std::vector<Question> result;
    for (const auto& question : questions_) {
        if (question.getDifficulty() == difficulty) {
            result.push_back(question);
        }
    }
    return result;
}

std::vector<Question> QuestionBank::selectRandom(Difficulty difficulty, std::size_t count) {
    auto candidates = getByDifficulty(difficulty);
    if (count > candidates.size()) {
        throw std::invalid_argument("출제할 문제 수가 문제은행보다 많습니다.");
    }
    // 전체 후보를 섞은 뒤 앞부분을 선택하면 같은 문제가 중복되지 않습니다.
    // 난수 엔진은 생성자에서 한 번만 초기화합니다.
    std::shuffle(candidates.begin(), candidates.end(), randomEngine_);
    candidates.erase(candidates.begin() + static_cast<std::ptrdiff_t>(count), candidates.end());
    return candidates;
}

void QuestionBank::validateQuestions() const {
    std::set<int> ids;
    for (const auto& question : questions_) {
        if (!ids.insert(question.getId()).second) {
            throw std::logic_error("중복된 문제 ID입니다.");
        }
    }
    for (const auto difficulty : { Difficulty::Beginner, Difficulty::Intermediate,
                                   Difficulty::Advanced }) {
        if (getByDifficulty(difficulty).size() != 10) {
            throw std::logic_error("각 난이도에는 정확히 10문제가 필요합니다.");
        }
    }
}

void QuestionBank::loadQuestions() {
    // 데이터 정의를 한 곳에 모았습니다. 나중에는 이 함수에서 JSON을 읽어
    // 동일한 필드(id, difficulty, category, text, choices, correctAnswer,
    // explanation)로 Question을 생성하면 채점/출제 코드를 유지할 수 있습니다.
    // ID: 초급 101~110, 중급 201~210, 고급 301~310. 정답 번호: 1~4.
    questions_ = {
        {101, Difficulty::Beginner, "변수",
         "정수형 변수 score를 선언하면서 10으로 초기화하는 코드는?",
         {"int score = 10;", "int = score 10;", "score int = 10;", "int score == 10;"}, 1,
         "자료형, 변수 이름, 초기값 순서로 int score = 10;처럼 작성합니다."},
        {102, Difficulty::Beginner, "자료형",
         "참(true) 또는 거짓(false)을 표현하는 C++ 기본 자료형은?",
         {"char", "bool", "double", "void"}, 2,
         "bool은 논리값 true와 false를 표현하는 자료형입니다."},
        {103, Difficulty::Beginner, "연산자",
         "int a = 7; int b = 2;일 때 a / b의 값은?",
         {"3.5", "4", "3", "2"}, 3,
         "두 피연산자가 정수이면 정수 나눗셈을 수행합니다. 7 / 2는 3입니다."},
        {104, Difficulty::Beginner, "연산자",
         "정수 식 17 % 5의 값은?",
         {"3", "5", "1", "2"}, 4,
         "%는 정수 나눗셈의 나머지 연산자입니다. 17 = 5 * 3 + 2이므로 나머지는 2입니다."},
        {105, Difficulty::Beginner, "조건문",
         "다음 코드의 출력은?\nint x = 5;\nif (x >= 5) std::cout << \"A\";\nelse std::cout << \"B\";",
         {"A", "B", "AB", "출력 없음"}, 1,
         "x는 5이므로 x >= 5가 참입니다. if의 본문만 실행되어 A를 출력합니다."},
        {106, Difficulty::Beginner, "연산자",
         "정수형 변수 x의 값에 관계없이, x가 0보다 크고 5보다 작을 때에만 참이 되는 식은?",
         {"x > 0 || x > 5", "x > 0 && x < 5", "x < 0 && x < 5", "x == 0 || x == 5"}, 2,
         "논리 AND 연산자 &&는 양쪽 조건이 모두 참일 때 참입니다. x > 0 || x > 5는 x가 5 이상이어도 참이므로 올바른 범위 검사가 아닙니다."},
        {107, Difficulty::Beginner, "반복문",
         "다음 코드 실행 후 sum의 값은?\nint sum = 0;\nfor (int i = 1; i <= 3; ++i) { sum += i; }",
         {"3", "5", "6", "7"}, 3,
         "i가 1, 2, 3일 때 본문을 실행하므로 sum은 1 + 2 + 3 = 6입니다."},
        {108, Difficulty::Beginner, "반복문",
         "다음 while문의 본문은 몇 번 실행되는가?\nint n = 0;\nwhile (n < 3) { ++n; }",
         {"0번", "1번", "2번", "3번"}, 4,
         "n이 0, 1, 2일 때 조건이 참입니다. n이 3이 되면 종료하여 총 3번 실행합니다."},
        {109, Difficulty::Beginner, "변수",
         "초기화한 뒤 값을 다시 대입할 수 없는 정수형 변수의 선언은?",
         {"const int limit = 10;", "int limit = 10;", "double limit = 10;", "bool limit = true;"}, 1,
         "const로 선언한 변수는 초기화한 뒤 대입으로 값을 변경할 수 없습니다."},
        {110, Difficulty::Beginner, "반복문",
         "반복문 본문에서 break;가 실행되면 어떻게 되는가? (내부 switch문은 없음)",
         {"현재 프로그램 전체가 종료된다.", "가장 안쪽의 해당 반복문을 즉시 종료한다.",
          "다음 반복으로 바로 넘어간다.", "반복 횟수를 두 배로 늘린다."}, 2,
         "break는 해당 반복문을 빠져나갑니다. 다음 반복으로 넘어가는 문장은 continue입니다."},

        {201, Difficulty::Intermediate, "배열",
         "int arr[3] = {10, 20, 30};일 때 arr[1]의 값은?",
         {"10", "20", "30", "1"}, 2,
         "배열 인덱스는 0부터 시작하므로 arr[1]은 두 번째 원소인 20입니다."},
        {202, Difficulty::Intermediate, "배열",
         "int arr[5] = {};에서 배열 원소에 접근할 수 있는 유효 인덱스 범위는?",
         {"1~5", "0~5", "0~4", "1~4"}, 3,
         "길이가 5인 배열의 인덱스는 0부터 4까지입니다. arr[5]는 원소 접근 범위를 벗어납니다."},
        {203, Difficulty::Intermediate, "함수",
         "int add(int a, int b) { return a + b; }일 때 add(2, 3)의 반환값은?",
         {"2", "3", "6", "5"}, 4,
         "매개변수 a와 b에 각각 2와 3이 전달되고 두 값의 합인 5를 반환합니다."},
        {204, Difficulty::Intermediate, "함수",
         "다음 코드 실행 후 x의 값은?\nvoid change(int n) { n = 9; }\n// main 내부\nint x = 1;\nchange(x);",
         {"1", "9", "0", "컴파일 오류"}, 1,
         "값 전달에서는 x의 복사본인 n만 변경됩니다. 원래 변수 x는 1을 유지합니다."},
        {205, Difficulty::Intermediate, "참조자",
         "다음 코드 실행 후 x의 값은?\nint x = 5;\nint& ref = x;\nref = 8;",
         {"5", "8", "0", "컴파일 오류"}, 2,
         "참조자 ref는 x의 다른 이름입니다. ref에 8을 대입하면 x도 8이 됩니다."},
        {206, Difficulty::Intermediate, "참조자",
         "다음 코드 실행 후 x의 값은?\nvoid increment(int& n) { ++n; }\n// main 내부\nint x = 4;\nincrement(x);",
         {"3", "4", "5", "컴파일 오류"}, 3,
         "참조 매개변수 n은 전달한 x를 직접 가리키므로 ++n으로 x가 5가 됩니다."},
        {207, Difficulty::Intermediate, "포인터",
         "int x = 7;일 때 x의 주소로 정수 포인터 p를 초기화하는 코드는?",
         {"int* p = x;", "int p = &x;", "int* p = *x;", "int* p = &x;"}, 4,
         "int*는 정수 포인터 자료형이며 &x는 x의 주소를 구하는 식입니다."},
        {208, Difficulty::Intermediate, "포인터",
         "다음 코드 실행 후 x의 값은?\nint x = 7;\nint* p = &x;\n*p = 12;",
         {"12", "7", "0", "컴파일 오류"}, 1,
         "*p는 p가 가리키는 변수 x에 접근합니다. *p = 12는 x를 12로 변경합니다."},
        {209, Difficulty::Intermediate, "문자열",
         "std::string s = \"C++\";일 때 s.size()의 값은?",
         {"2", "3", "4", "0"}, 2,
         "문자열 내용은 C, +, +의 세 문자입니다. size()는 끝의 널 문자를 길이에 포함하지 않습니다."},
        {210, Difficulty::Intermediate, "문자열",
         "std::string a = \"Code\"; std::string b = \"Master\";일 때 a + b의 결과는?",
         {"Code Master", "MasterCode", "CodeMaster", "컴파일 오류"}, 3,
         "std::string의 + 연산은 두 문자열을 순서대로 연결하며 공백을 자동으로 넣지 않습니다."},

        {301, Difficulty::Advanced, "클래스",
         "C++에서 class로 선언한 클래스의 멤버는 접근 지정자를 생략하면 어떤 접근 수준인가?",
         {"public", "protected", "전역 접근", "private"}, 4,
         "class의 기본 멤버 접근 수준은 private입니다. struct의 기본 멤버 접근 수준은 public입니다."},
        {302, Difficulty::Advanced, "객체",
         "class Player {};가 선언되어 있을 때 Player 타입 객체 p를 정의하는 코드는?",
         {"Player p;", "class p = Player;", "Player = p;", "object p(Player);"}, 1,
         "클래스 이름을 자료형처럼 사용하여 Player p;로 객체를 정의합니다."},
        {303, Difficulty::Advanced, "생성자",
         "클래스 이름이 Player일 때 클래스 내부에서 기본 생성자를 선언하는 올바른 코드는?",
         {"void Player();", "Player();", "int Player();", "constructor Player();"}, 2,
         "생성자는 클래스와 이름이 같으며 반환형을 쓰지 않습니다. Player();는 매개변수가 없는 생성자 선언입니다."},
        {304, Difficulty::Advanced, "생성자",
         "다음 객체 생성 후 c.value()의 반환값은?\nclass Counter {\n    int count;\npublic:\n    Counter(int n) : count(n) {}\n    int value() const { return count; }\n};\nCounter c(7);",
         {"0", "1", "7", "컴파일 오류"}, 3,
         "생성자의 멤버 초기화 목록 count(n)이 전달받은 7로 count를 초기화합니다."},
        {305, Difficulty::Advanced, "상속",
         "Base가 이미 정의된 클래스일 때 Derived가 Base를 public 상속하는 올바른 선언은?",
         {"class Derived extends Base {};", "class Derived : private Base {};",
          "class Base : public Derived {};", "class Derived : public Base {};"}, 4,
         "C++는 콜론 뒤에 접근 지정자와 기반 클래스 이름을 써서 상속합니다."},
        {306, Difficulty::Advanced, "캡슐화",
         "잔액을 음수로 설정하지 못하도록 하는 설계로 가장 적절한 것은?",
         {"잔액을 private으로 숨기고 public 메서드에서 입력값을 검사한다.",
          "잔액을 public으로 공개하고 어디서나 변경하게 한다.",
          "잔액을 전역 변수로 바꾼다.", "모든 접근 지정자를 public으로 바꾼다."}, 1,
         "내부 데이터를 private으로 보호하고 메서드에서 변경 조건을 검사하면 객체의 유효한 상태를 유지할 수 있습니다."},
        {307, Difficulty::Advanced, "다형성",
         "다음 코드에서 p->value()의 반환값은?\nstruct Base { virtual int value() const { return 1; } };\nstruct Derived : Base { int value() const override { return 2; } };\nDerived d;\nBase* p = &d;",
         {"1", "2", "0", "컴파일 오류"}, 2,
         "가상 함수 호출은 실제 객체 타입을 따릅니다. p가 Derived 객체를 가리키므로 Derived::value()가 실행됩니다."},
        {308, Difficulty::Advanced, "다형성",
         "파생 클래스의 멤버 함수 선언에 붙인 override의 역할은?",
         {"함수를 자동으로 두 번 호출한다.", "함수를 전역 함수로 바꾼다.",
          "기반 클래스의 가상 함수를 올바르게 재정의하는지 컴파일러가 검사하게 한다.",
          "모든 멤버를 public으로 바꾼다."}, 3,
         "override는 기반 클래스의 가상 함수를 재정의한다는 의도를 표시합니다. 서명이 맞지 않으면 컴파일 오류가 발생합니다."},
        {309, Difficulty::Advanced, "상속",
         "기반 클래스의 private 데이터 멤버에 대해 옳은 설명은? (friend 선언 없음)",
         {"파생 클래스는 항상 직접 접근할 수 있다.", "어떤 전역 함수든 직접 접근할 수 있다.",
          "public 상속하면 해당 멤버도 자동으로 public이 된다.",
          "파생 클래스는 직접 접근할 수 없으며, 기반 클래스가 제공한 접근 가능한 메서드를 이용할 수 있다."}, 4,
         "기반 클래스의 private 멤버는 파생 클래스에서도 직접 접근할 수 없습니다. public 또는 접근 가능한 protected 메서드를 통해 간접적으로 이용할 수 있습니다."},
        {310, Difficulty::Advanced, "다형성",
         "new Derived로 생성한 객체를 Base*에 저장한 뒤 delete할 때, 올바른 소멸을 위한 Base 소멸자 선언은? (public 영역)",
         {"virtual ~Base() = default;", "~Base() = default;", "void ~Base();", "static ~Base();"}, 1,
         "기반 클래스 포인터로 파생 객체를 삭제하려면 기반 클래스 소멸자가 virtual이어야 합니다. 그래야 파생 클래스 소멸자도 올바르게 호출됩니다."}
    };
}
