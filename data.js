export const modules = [
  { id: 'foundations', title: '计算思维', subtitle: '从信息到算法，建立第一张地图', description: '认识二进制与逻辑，把一个大问题拆成能执行的小步骤。', icon: 'binary', level: '零基础', color: 'green', lessons: ['binary', 'logic', 'algorithm'] },
  { id: 'python', title: 'Python 入门', subtitle: '让想法变成可以运行的程序', description: '用变量保存信息，用分支做选择，用循环处理重复任务。', icon: 'code', level: '编程起步', color: 'blue', lessons: ['variable', 'condition', 'loop'] },
  { id: 'algorithms', title: '算法探索', subtitle: '同一个问题，寻找更好的解法', description: '亲手观察查找与排序，理解算法随着数据量增长会发生什么。', icon: 'nodes', level: '进阶探索', color: 'amber', lessons: ['search', 'sorting', 'complexity'] }
];

export const lessons = [
  {
    id: 'binary', module: 'foundations', title: '计算机如何读懂 0 和 1', summary: '点亮八个开关，看看数字如何被编码。', duration: 12, tag: '信息表示', lab: 'binary',
    intro: '电灯有开和关两种状态。计算机也能用两种容易区分的物理状态来存储信息，我们用 0 和 1 表示它们。',
    sections: [
      { title: '一个位置，两种可能', body: '一个二进制位叫作 bit（比特），只能是 0 或 1。两个 bit 可以组成 00、01、10、11，共四种组合；增加一个 bit，能表示的组合数量就翻倍。' },
      { title: '每一位都有自己的分量', body: '十进制从右往左是个位、十位、百位；二进制从右往左的位权是 1、2、4、8。把值为 1 的位权相加，就得到这个非负整数的十进制值。', code: '二进制 1101\n= 1 × 8 + 1 × 4 + 0 × 2 + 1 × 1\n= 十进制 13' },
      { title: '数字之外，也能约定规则', body: '四个 bit 可以表示 0 到 15；实验中的八个 bit 可以表示 0 到 255，共 256 个非负整数。文字、图像、声音也能编码成二进制，但要遵守相应的编码规则；同一串 0 和 1 在不同规则下可能代表不同信息。' }
    ],
    takeaways: ['一个 bit 只有 0 和 1 两种状态。', '把值为 1 的位权相加，得到十进制数。', '八个 bit 能表示 256 种不同组合。'],
    prediction: { prompt: '八位开关显示 01000001，也就是 65。只把最右边的开关从 1 关成 0，数值会变成多少？', options: ['66', '64', '32'], answer: 1, explanation: '最右边的位权是 1。关闭这一位相当于减去 1，因此 65 变成 64，对应 01000000。' },
    question: { prompt: '四位二进制 1010 表示哪个十进制整数？', options: ['5', '12', '10', '1010'], answer: 2, hint: '从左到右的位权依次是 8、4、2、1，只加上亮着的位。', explanation: '1010 中值为 1 的位置对应 8 和 2，所以结果是 8 + 2 = 10。位数不变时，最左边的一位分量最大。' }
  },
  {
    id: 'logic', module: 'foundations', title: '把判断变成逻辑', summary: '用与、或、非，把日常条件说清楚。', duration: 10, tag: '布尔逻辑', lab: 'logic',
    intro: '图书馆要求“带了借书证，并且还有可借额度”才能借书。这样的规则可以写成一个有明确结果的逻辑表达式。',
    sections: [
      { title: '先把事实变成真或假', body: '布尔值只有两种：True（真）和 False（假）。例如“年龄大于等于 12”是一个判断，对一个确定的年龄，它会得到一个布尔值。' },
      { title: '用三个运算组合条件', body: 'A and B（与）要求两个条件都为真；A or B（或）只要至少一个条件为真；not A（非）把真变成假、把假变成真。这里的“或”也包含两个条件都成立的情况。实验还可以比较 XOR（异或）：只有两个输入不同时，结果才为真。', code: 'True and False  # False\nTrue or False   # True\nnot True        # False' },
      { title: '复杂规则，先分清层次', body: '“有借书证，并且有额度或老师许可”容易产生歧义。写成“有借书证 and（有额度 or 老师许可）”，就明确了先检查括号里的条件，再与借书证条件合并。' }
    ],
    takeaways: ['布尔值表示真或假。', '与要求全部成立，或要求至少一个成立。', '非会反转真假，括号能明确判断顺序。'],
    prediction: { prompt: '逻辑实验选择 AND（与），输入 A = 1、B = 0。输出灯会怎样？', options: ['熄灭，输出 0', '点亮，输出 1', '无法决定'], answer: 0, explanation: 'AND 要求两个输入都为 1。现在 B 为 0，条件没有全部满足，所以输出为 0。' },
    question: { prompt: 'A 为 True，B 为 False。表达式 A and (not B) 的结果是什么？', options: ['False', 'True', '无法判断', '得到数字 1 和 0'], answer: 1, hint: '先算括号：not False 会变成什么？', explanation: 'not B 把 False 变为 True，因此整个式子是 True and True，结果为 True。' }
  },
  {
    id: 'algorithm', module: 'foundations', title: '给问题一份可执行的说明书', summary: '从整理书包开始，练习分解与算法。', duration: 10, tag: '问题分解', lab: null,
    intro: '“把书包整理好”是一个目标，但不是完整的操作步骤。如果交给一个只会严格执行指令的小机器人，你需要把任务说得更清楚。',
    sections: [
      { title: '先说明输入和目标', body: '输入是已经知道的信息，例如明天的课表和桌上的课本；目标是每门课需要的书都在书包里。明确输入与输出，才能判断方法有没有完成任务。' },
      { title: '把大任务拆成小步骤', body: '可以先读取课表，再逐门课找到课本，找到后放进书包，最后检查是否遗漏。把问题拆成更容易处理的小问题，叫作问题分解。', code: '读取明天的课程列表\n对每一门课程：\n    找到对应课本\n    把课本放进书包\n检查是否还有缺少的课本' },
      { title: '好步骤也要考虑例外', body: '算法是解决一类问题的明确步骤。“一直找，直到找到”为缺书的情况留下了无限等待。更完整的做法是找完指定位置仍未找到，就记录缺书并继续处理其他课程。' }
    ],
    takeaways: ['先明确输入是什么、目标是什么。', '把大任务拆成能逐步执行的小任务。', '为例外和结束条件写清楚处理规则。'],
    prediction: { prompt: '依次检查 [蓝卡、红卡、红卡]，规则是“找到第一张红卡就停止”。最后会选中哪张？', options: ['第一张蓝卡', '第三张卡', '第二张卡'], answer: 2, explanation: '先跳过蓝卡，第二张是红卡，已经满足停止条件。因此选中第二张，不再继续检查第三张。' },
    question: { prompt: '给整理书包的机器人写指令，哪一条最明确、容易检查？', options: ['认真一点整理', '把有用的东西都放进去', '一直找，直到书包完美', '按照课表逐门检查，把对应课本放进书包'], answer: 3, hint: '考虑机器人能不能知道每一步做什么，以及什么时候完成。', explanation: '按课表逐门检查给出了参照信息、重复对象和具体动作。“认真”“有用”“完美”没有明确标准，无法让机器人稳定执行。' }
  },
  {
    id: 'variable', module: 'python', title: '用变量记住一个值', summary: '给数据命名，跟踪程序里的变化。', duration: 12, tag: '变量与赋值', lab: null,
    intro: '计分板会记住当前分数，答对一题后再更新。变量让程序也能用一个名字找到当前需要的数据。',
    sections: [
      { title: '赋值是建立关联', body: '在 Python 中，score = 3 把名字 score 关联到整数 3。等号在这里表示赋值，不是数学里的相等判断；判断两个值是否相等使用 ==。', code: 'score = 3\nprint(score)  # 输出 3' },
      { title: '更新时，先计算右边', body: '执行 score = score + 2 时，程序先读取 score 当前的值，计算加 2 的结果，再让 score 指向新结果。给变量取清楚的名字，比只用 a、b 更容易理解程序。', code: 'score = 3\nscore = score + 2\nprint(score)  # 输出 5' },
      { title: '赋值不会自动建立公式', body: '对于这里的整数例子，backup = score 让 backup 关联到当时的整数值。之后给 score 重新赋值，backup 不会随之改变。它不是一条会持续更新的电子表格公式。', code: 'score = 3\nbackup = score\nscore = 5\nprint(backup)  # 输出 3' }
    ],
    takeaways: ['变量名让程序能够访问一个值。', '赋值先计算右边，再更新左边的关联。', '整数变量的赋值不会建立自动更新的公式。'],
    playground: { code: 'score = 10\nprint("开始时 score =", score)\n\nscore = score + 5\nprint("答对一题后 score =", score)\n\nbackup = score\nscore = 0\nprint("score =", score, "backup =", backup)', challenge: '只改第一行，让最后一行显示 backup = 100。先算一算，再运行验证。' },
    prediction: { prompt: '程序先执行 score = 10，再执行 score = score + 5。接下来 print(score) 会输出什么？', options: ['10', '15', '5'], answer: 1, explanation: '右边先计算当前值 10 + 5，得到 15，再把 score 更新为 15。原来的值不会让表达式变成数学矛盾。' },
    question: { prompt: '执行 x = 4、y = x、x = x + 1 后，y 的值是多少？', options: ['5', '4', '1', '无法确定'], answer: 1, hint: '执行 y = x 时，x 关联的是哪个整数？后来有没有重新给 y 赋值？', explanation: 'y = x 时，y 关联到整数 4。后来更新的是 x，没有给 y 重新赋值，所以 y 仍然是 4。' }
  },
  {
    id: 'condition', module: 'python', title: '让程序学会做选择', summary: '用 if 和 else，处理不同的情况。', duration: 12, tag: '条件分支', lab: null,
    intro: '下雨时带伞，没下雨时轻装出门。程序也需要根据条件，选择接下来执行哪一段代码。',
    sections: [
      { title: '条件为真，才执行这一段', body: 'if 后面写一个条件，并以冒号结尾。下面缩进的代码属于这个分支，只有条件为真时才会执行。Python 用缩进表示代码块的归属。', code: 'raining = True\nif raining:\n    print("带上雨伞")' },
      { title: '用 else 处理另一种情况', body: 'if 与 else 构成二选一：条件为真时执行 if 分支，否则执行 else 分支。>= 表示大于或等于，因此分数刚好等于 60 时也满足 score >= 60。', code: 'score = 60\nif score >= 60:\n    print("通过")\nelse:\n    print("再练习一次")' },
      { title: '多个条件，按顺序检查', body: '需要多个分支时可以使用 elif。程序从上到下检查条件，执行第一个满足条件的分支后，就跳过同一组中剩下的 elif 和 else。安排条件顺序时，要留意范围是否重叠。' }
    ],
    takeaways: ['if 根据条件真假选择代码块。', '缩进表示哪些语句属于同一个分支。', 'if / elif / else 只执行第一个满足条件的分支。'],
    playground: { code: 'score = 75\n\nif score >= 90:\n    print("优秀")\nelif score >= 60:\n    print("通过")\nelse:\n    print("再练习一次")', challenge: '把 score 分别改成 90、60、59，先预测输出再运行。然后交换前两个分支的顺序，看看 90 分会输出什么。' },
    prediction: { prompt: 'score = 90，程序先判断 if score >= 60 输出“通过”，再用 elif score >= 90 输出“优秀”。实际输出什么？', options: ['优秀', '通过和优秀', '通过'], answer: 2, explanation: '第一个条件已经成立，程序执行“通过”后跳过同一组的 elif。若想优先判断“优秀”，应把 >= 90 放在前面。' },
    question: { prompt: 'score = 59 时，执行示例中的 if score >= 60 / else，会输出什么？', options: ['通过', '两句都会输出', '再练习一次', '什么也不输出'], answer: 2, hint: '59 是否大于或等于 60？条件为假时会走哪个分支？', explanation: '59 >= 60 为 False，所以跳过 if 的代码，执行 else 分支，输出“再练习一次”。' }
  },
  {
    id: 'loop', module: 'python', title: '把重复的事情交给循环', summary: '用 for 遍历，用累加器保存结果。', duration: 14, tag: '循环与遍历', lab: null,
    intro: '给一组同学逐个发练习本，不需要为每个人写一条不同的指令。“对每一个人，发一本”就是循环的想法。',
    sections: [
      { title: '逐个取出，重复执行', body: 'for 循环会依次取出序列里的元素，交给循环变量，再执行缩进的代码。下面的程序会依次输出三个名字。', code: 'for name in ["小林", "小陈", "小周"]:\n    print(name)' },
      { title: 'range 的终点不包含在内', body: 'range(1, 4) 产生 1、2、3，包含起点 1，但不包含终点 4。range(4) 则从 0 开始，产生 0、1、2、3。明确边界能避免多执行或少执行一次。', code: 'for number in range(1, 4):\n    print(number)  # 依次输出 1、2、3' },
      { title: '让结果一点点积累', body: '累加器先设为 0，再在每次循环中加上当前数字。初始化要放在循环外，否则每轮都会把之前的结果清空。', code: 'total = 0\nfor number in range(1, 4):\n    total = total + number\nprint(total)  # 输出 6' }
    ],
    takeaways: ['for 依次取出元素，再执行循环体。', 'range 包含起点，但不包含终点。', '累加器在循环外初始化，在循环内更新。'],
    playground: { code: 'total = 0\nfor number in range(1, 6):\n    total = total + number\n    print("加上", number, "后，total =", total)\n\nprint("最后 total =", total)', challenge: '改动 range，算出 1 到 100 的和。再想办法只打印最后的结果。' },
    prediction: { prompt: '执行 for number in range(3): print(number)，第一行和最后一行分别是什么？', options: ['0 和 2', '1 和 3', '0 和 3'], answer: 0, explanation: 'range(3) 默认从 0 开始，终点 3 不包含在内，实际依次输出 0、1、2。' },
    question: { prompt: '示例的 total 从 0 开始，依次加上 range(1, 4) 中的数，最后是多少？', options: ['6', '10', '4', '3'], answer: 0, hint: 'range(1, 4) 不包含 4。把实际遍历的三个数加起来。', explanation: '循环依次处理 1、2、3，total 的变化是 0 → 1 → 3 → 6，所以最后输出 6。' }
  },
  {
    id: 'search', module: 'algorithms', title: '每次排除一半的二分查找', summary: '在有序数字中，用更少的比较找到目标。', duration: 15, tag: '查找算法', lab: 'search',
    intro: '猜一个 1 到 100 的整数，每次都能知道“太大”或“太小”。从中间开始猜，就能在一次判断后排除大约一半的候选数字。',
    sections: [
      { title: '开始之前，数据必须有序', body: '二分查找依靠从小到大的顺序排除不可能的区域。目标比中间值大时，只需继续查看右半边；目标比中间值小时，只需查看左半边。无序列表不能直接这样排除。' },
      { title: '比较中间，缩小边界', body: '给当前范围的两端命名为 left 和 right，中间下标可以用 (left + right) // 2 计算。相等就找到；不相等就排除中间元素和不可能的那半边。', code: '有序列表：[2, 5, 8, 12, 16, 23, 38]\n目标：23\n先比较中间值 12 → 只保留 [16, 23, 38]\n再比较中间值 23 → 找到了' },
      { title: '找不到，也要有明确结论', body: '当 left 大于 right 时，候选范围已经为空，表示目标不在列表里。每轮必须让范围缩小，才能保证结束。重复值存在时，普通二分查找可以找到其中一个，但不一定是第一个。' }
    ],
    takeaways: ['二分查找首先要求数据有序。', '比较中间值后，排除约一半候选范围。', '范围为空时，可以确定目标不存在。'],
    prediction: { prompt: '在有序列表 [3, 6, 9, 12, 15] 中查找 10，先与中间值 9 比较。下一步比较 12 时会怎样？', options: ['立即找到 10', '只保留 15', '候选范围变空，结束查找'], answer: 2, explanation: '比较 9 后只剩 [12, 15]；10 小于 12，但 12 左边的 9 已经排除，所以候选范围变空。二分查找也能明确回答“不存在”。' },
    question: { prompt: '在 [2, 5, 8, 12, 16, 23, 38] 中查找 23，第一次与 12 比较后，应保留哪个范围？', options: ['[2, 5, 8]', '[12, 16, 23, 38]', '整个列表都保留', '[16, 23, 38]'], answer: 3, hint: '23 比 12 大。12 本身已经比较过，还需要保留吗？', explanation: '列表有序，12 左边的数都小于目标，12 本身也不是目标，因此只保留右边的 [16, 23, 38]。' }
  },
  {
    id: 'sorting', module: 'algorithms', title: '看数字如何一步步排好队', summary: '比较相邻元素，亲手走完一轮冒泡排序。', duration: 15, tag: '排序算法', lab: 'sorting',
    intro: '把高矮不同的书排成一列，可以每次只检查相邻两本，顺序反了就交换。冒泡排序用类似的方法处理数字。',
    sections: [
      { title: '只比较身边的两个数', body: '要从小到大排序，就从左往右比较相邻元素。如果左边比右边大，就交换它们；否则保持原样，然后继续比较下一对。交换之后，要以列表的新状态继续。' },
      { title: '一轮之后，最大值到达右端', body: '从左到右完整扫描一次，当前未排好区域的最大值会被一步步推到最右端。下面的一轮结束后，5 已经就位，但前面的数还没有全部排好。', code: '[5, 2, 4, 1]\n[2, 5, 4, 1]  # 交换 5 和 2\n[2, 4, 5, 1]  # 交换 5 和 4\n[2, 4, 1, 5]  # 交换 5 和 1' },
      { title: '缩小范围，直到没有交换', body: '每轮结束后，已经就位的右端元素不必再比较。对剩余部分继续扫描；如果某一轮没有发生任何交换，列表就已经有序，可以提前结束。最坏情况下，冒泡排序需要的比较次数按 n² 的量级增长。' }
    ],
    takeaways: ['比较相邻元素，逆序时才交换。', '一轮扫描把未排序区域的最大值推到右端。', '某一轮没有交换时，可以提前结束。'],
    prediction: { prompt: '对 [3, 1, 2] 做升序冒泡排序，刚比较完第一对 3 和 1，列表会是什么？', options: ['[1, 2, 3]', '[1, 3, 2]', '[3, 1, 2]'], answer: 1, explanation: '3 大于 1，所以只交换这一对，得到 [1, 3, 2]。后面的 3 和 2 还没有比较，整个列表暂时没有排好。' },
    question: { prompt: '对 [5, 2, 4, 1] 从左到右完成一轮冒泡排序后，列表是什么？', options: ['[1, 2, 4, 5]', '[2, 5, 4, 1]', '[2, 4, 1, 5]', '[5, 4, 2, 1]'], answer: 2, hint: '按顺序比较三对相邻元素。每次交换后，5 都会向右移动一个位置。', explanation: '这一轮依次交换 5 与 2、5 与 4、5 与 1，得到 [2, 4, 1, 5]。完成一轮只保证最大值就位，不代表整个列表已经排好。' }
  },
  {
    id: 'complexity', module: 'algorithms', title: '数据变多，算法会慢多少', summary: '用增长趋势比较算法，而不只看一次运行。', duration: 12, tag: '时间复杂度', lab: null,
    intro: '在十张卡片里找一张，逐张查看很容易。换成十万张时，同一个方法可能就显得慢了。我们需要关心算法如何随数据量增长。',
    sections: [
      { title: '先确定你在数什么', body: '比较查找算法时，可以数“与目标比较了多少次”。实际耗时还受设备和实现影响，操作次数更适合帮助我们观察增长规律。讨论最坏情况，就是考虑最不利的输入。' },
      { title: '三种常见的增长方式', body: '线性查找最坏需要检查全部 n 个元素，记作 O(n)；二分查找每次缩小约一半，最坏比较次数按对数增长，记作 O(log n)；冒泡排序最坏需要 O(n²) 次比较。大 O 描述的是增长量级，而不是精确秒数。', code: '数据量翻倍时，观察较大规模下的趋势：\nO(n)      → 操作量约变为 2 倍\nO(log n)  → 二分查找通常只多约 1 轮\nO(n²)     → 操作量约变为 4 倍' },
      { title: '更好的量级，也要看使用条件', body: '二分查找需要有序数据，如果只查一次，先排序也有成本。小数据上，常数开销可能更显著。选择算法时，要一起考虑数据特点、准备成本和需要重复执行的次数。' }
    ],
    takeaways: ['比较增长趋势，而不只比较一次耗时。', '常见量级有 O(log n)、O(n)、O(n²)。', '选择算法还要考虑准备成本和数据特点。'],
    prediction: { prompt: '线性查找一个不存在的目标：列表从 100 个元素变成 300 个元素，最坏需要检查的元素数变为几倍？', options: ['3 倍', '9 倍', '只多约 1 次'], answer: 0, explanation: '线性查找遇到不存在的目标时要检查所有元素。检查次数从 100 变成 300，恰好是 3 倍，体现了线性增长。' },
    question: { prompt: '有序数据量从 1,000 增至 2,000，二分查找在最坏情况下的比较次数大致怎样变化？', options: ['变成约 2 倍', '只增加约 1 次', '变成约 4 倍', '完全不变'], answer: 1, hint: '数据量翻倍后，只要再排除一次“大约一半”，就回到原来的规模。', explanation: '二分查找的比较次数按对数增长。数据量翻倍，最坏比较次数大致只多一次；这与逐个检查的线性增长不同。' }
  }
];

export const glossary = [
  { id: '比特', term: '比特', english: 'bit', definition: '二进制信息的一个位，只能取 0 或 1。', lesson: 'binary' },
  { id: '二进制', term: '二进制', english: 'binary', definition: '以 2 为基数的计数方式，只使用数字 0 和 1。', lesson: 'binary' },
  { id: '位权', term: '位权', english: 'place value', definition: '一个数位代表的分量；二进制从右往左依次是 1、2、4、8。', lesson: 'binary' },
  { id: '布尔值', term: '布尔值', english: 'Boolean', definition: '只有真和假两种可能的值，Python 中写作 True 和 False。', lesson: 'logic' },
  { id: '算法', term: '算法', english: 'algorithm', definition: '解决一类问题的一组明确、可执行的步骤。', lesson: 'algorithm' },
  { id: '问题分解', term: '问题分解', english: 'decomposition', definition: '把一个大问题拆成多个更容易处理的小问题。', lesson: 'algorithm' },
  { id: '变量', term: '变量', english: 'variable', definition: '程序中用于关联和访问数据的名字。', lesson: 'variable' },
  { id: '赋值', term: '赋值', english: 'assignment', definition: '把一个值与变量名关联；Python 使用单个等号。', lesson: 'variable' },
  { id: '条件分支', term: '条件分支', english: 'conditional', definition: '根据条件的真假，选择要执行的代码路径。', lesson: 'condition' },
  { id: '循环', term: '循环', english: 'loop', definition: '按规则重复执行一段代码的结构。', lesson: 'loop' },
  { id: '二分查找', term: '二分查找', english: 'binary search', definition: '在有序数据中比较中间值，每次排除约一半候选范围的查找方法。', lesson: 'search' },
  { id: '时间复杂度', term: '时间复杂度', english: 'time complexity', definition: '描述算法所需操作量如何随输入规模增长，常用大 O 表示量级。', lesson: 'complexity' }
];

export const sources = [
  { title: 'Boxi Yu · 可运行的课程讲义', url: 'https://boxiyu.github.io/courses/', note: '用户指定的主要参考：逐步运行、先预测后揭晓、课末自测。' },
  { title: 'AIE1001 · 计算机与数制', url: 'https://boxi-cs.github.io/aie1001/L01/', note: '参考短章节、可修改输入的进制实验、要点总结和分层练习。' },
  { title: '数据结构 · 复杂度与证明', url: 'https://boxi-cs.github.io/data-structures/L01/', note: '参考知识地图、代码运行轨迹、预测题和章末理解检查。' },
  { title: 'CS50 · 从概念到练习', url: 'https://cs50.harvard.edu/x/', note: '参考分模块学习、练习与项目相结合的组织方式。' },
  { title: 'CS61A · 讲授与实验', url: 'https://cs61a.org/fa26/syllabus/', note: '参考概念讲解、动手实验和理解检查的教学层次。' },
  { title: 'VisuAlgo · 看见算法运行', url: 'https://visualgo.net/en/sorting', note: '参考逐步播放、自定义输入和运行过程解释的交互思路。' },
  { title: 'Exercism · 有反馈的练习', url: 'https://exercism.org/docs/using/feedback', note: '参考及时、具体、能帮助下一次尝试的反馈方式。' }
];

export const furtherCourses = [
  { title: 'AIE1001 · AI 编程入门', level: '大学入门', description: '参考课程外链：从计算机与数制到 Python、递归、面向对象和 AI 应用的互动讲义。', url: 'https://boxi-cs.github.io/aie1001/' },
  { title: 'Data Structures · 数据结构', level: '大学核心', description: '参考课程外链：探索数组、链表、树、哈希表和图，支持 Python 与 Java 版本。', url: 'https://boxi-cs.github.io/data-structures/' },
  { title: 'CSC4801 · AI 辅助软件工程', level: '大学进阶', description: '参考课程外链：理解大语言模型与 agent，再把它们用于需求、编码、测试和团队协作。', url: 'https://boxi-cs.github.io/csc4801/' }
];
