---
layout: post
title: C++ 细节
categories: 计算机
description: some word here
keywords: keyword1, keyword2
mermaid: false
sequence: false
flow: false
mathjax: false
mindmap: false
mindmap2: false
---

1.  初始化大量数组数据时，不要逐项赋值，而要善用大括号初始化。
    下面是一个不善于使用数组初始化的例子，逐项赋值显得繁琐且容易出错：
```cpp
    #include <iostream>

    int main() {
        // 初始化一个包含3x3矩阵的二维数组，逐项赋值
        int matrix[3][3];

        matrix[0][0] = 1;
        matrix[0][1] = 2;
        matrix[0][2] = 3;
        matrix[1][0] = 4;
        matrix[1][1] = 5;
        matrix[1][2] = 6;
        matrix[2][0] = 7;
        matrix[2][1] = 8;
        matrix[2][2] = 9;

        // 输出矩阵
        for (int i = 0; i < 3; ++i) {
            for (int j = 0; j < 3; ++j) {
                std::cout << matrix[i][j] << " ";
            }
            std::cout << std::endl;
        }

        return 0;
    }
    ```
    在这个例子中，虽然我们实现了一个3x3矩阵的初始化，但逐项赋值显得冗长，尤其是当矩阵规模变大时，会使代码可读性变差，且容易因人为错误出问题。

    接下来展示一个善用数组初始化的正例：
    ```cpp
    #include <iostream>

    int main() {
        // 使用大括号一次性初始化3x3矩阵
        int matrix[3][3] = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };

        // 输出矩阵
        for (int i = 0; i < 3; ++i) {
            for (int j = 0; j < 3; ++j) {
                std::cout << matrix[i][j] << " ";
            }
            std::cout << std::endl;
        }

        return 0;
    }
    ```
    在这个正例中，我们通过使用大括号 {}，一次性对整个3x3矩阵进行了初始化。这样不仅代码简洁易读，还减少了出错的机会，尤其适用于更大的数组或矩阵。

    同样地，我们在初始化多层嵌套的类时，也可用数组初始化，而不是套用初始化的定义，往里(1，2，3，...)；
    建一个数组就好很多。如：
    ```cpp
    class Polynomial; // 向前声明
    class term        // 每一项
    {
        friend Polynomial;

    public:
        term(int c = 0, int ex = 0)
        {
            coef = c;
            exp = ex;
        }

    private:
        float coef; // 系数
        int exp;    // 指数
    };

    // int readyForSort[MaxTerms];
    int start = 0;
    class Polynomial
    {
    private:
        static term termArray[MaxTerms]; // 静态成员声明
        static int free, ansEnd;         // 静态成员声明
        int Start, End;                  // 多项式的起、止位置
    public:
        Polynomial(int terms[][2], int numTerms) // terms是系数和指数的二维数组，numTerms是项的数量
        {
            Start = free;
            for (int i = 0; i < numTerms; ++i)
            {
                termArray[free] = term(terms[i][0], terms[i][1]); // 初始化每一项
                free++;
            }
            End = free - 1; // 更新End为最后一项的位置
        }
        //…………
    };

    // 多项式5x^3 + 2x^2 - 4x + 7
    int terms[][2] = {
        {5, 3},   // 5x^3
        {2, 2},   // 2x^2
        {-4, 1},  // -4x
        {7, 0}    // 7
    };
    ```

    再比如：
    ```cpp
    struct offsets {
        int a, b;
    };

    enum directions { N, NE, E, SE, S, SW, W, NW };

    offsets move[8] = {
        {-1,  0}, // N
        {-1,  1}, // NE
        { 0,  1}, // E
        { 1,  1}, // SE
        { 1,  0}, // S
        { 1, -1}, // SW
        { 0, -1}, // W
        {-1, -1}  // NW
    };
```