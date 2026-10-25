export const modules = [
  { id: 'foundations', title: 'Computational thinking', subtitle: 'Build a first map, from information to algorithms', description: 'Explore binary and logic, then break a large problem into steps a computer can follow.', icon: 'binary', level: 'No experience needed', color: 'green', lessons: ['binary', 'logic', 'algorithm'] },
  { id: 'python', title: 'Getting started with Python', subtitle: 'Turn an idea into a running program', description: 'Store information with variables, make choices with conditions, and handle repetition with loops.', icon: 'code', level: 'First steps in coding', color: 'blue', lessons: ['variable', 'condition', 'loop'] },
  { id: 'algorithms', title: 'Exploring algorithms', subtitle: 'Find a better way to solve the same problem', description: 'Watch searching and sorting in action, and discover what happens as the amount of data grows.', icon: 'nodes', level: 'Explore further', color: 'amber', lessons: ['search', 'sorting', 'complexity'] }
];

export const lessons = [
  {
    id: 'binary', module: 'foundations', title: 'How computers use 0 and 1', summary: 'Flip eight switches and discover how numbers are encoded.', duration: 12, tag: 'Representing information', lab: 'binary',
    intro: 'A light can be on or off. Computers can also store information using two physical states that are easy to tell apart. We represent those states with 0 and 1.',
    sections: [
      { title: 'One position, two possibilities', body: 'A binary digit is called a bit. It can be either 0 or 1. Two bits can form 00, 01, 10, and 11: four combinations. Each extra bit doubles the number of possible combinations.' },
      { title: 'Every position has a different weight', body: 'In decimal, positions from right to left represent ones, tens, hundreds, and so on. In binary, their weights are 1, 2, 4, 8, and so on. Add the weights of the positions containing 1 to find the decimal value of a nonnegative integer.', code: 'Binary 1101\n= 1 × 8 + 1 × 4 + 0 × 2 + 1 × 1\n= Decimal 13' },
      { title: 'An encoding gives the bits meaning', body: 'Four bits can represent the integers 0 to 15. The eight bits in the experiment can represent 0 to 255: 256 nonnegative integers. Text, images, and sound can also be encoded in binary, but each needs an agreed encoding. The same sequence of bits can mean different things under different rules.' }
    ],
    takeaways: ['A bit has two possible states: 0 and 1.', 'Add the weights of the 1 bits to find the decimal value.', 'Eight bits have 256 possible combinations.'],
    prediction: { prompt: 'The eight switches show 01000001, which is 65. If you change only the rightmost switch from 1 to 0, what will the value become?', options: ['66', '64', '32'], answer: 1, explanation: 'The rightmost position has a weight of 1. Turning it off subtracts 1, so 65 becomes 64, written as 01000000.' },
    question: { prompt: 'Which decimal integer does the four-bit binary number 1010 represent?', options: ['5', '12', '10', '1010'], answer: 2, hint: 'From left to right, the weights are 8, 4, 2, and 1. Add only the weights whose bits are on.', explanation: 'The 1 bits in 1010 have weights 8 and 2, so the value is 8 + 2 = 10. For a fixed number of bits, the leftmost position has the greatest weight.' }
  },
  {
    id: 'logic', module: 'foundations', title: 'Turn a rule into logic', summary: 'Use AND, OR, and NOT to describe everyday conditions precisely.', duration: 10, tag: 'Boolean logic', lab: 'logic',
    intro: 'A library lets you borrow a book if you have your library card AND have not reached your borrowing limit. We can express this rule as a logical expression with a definite result.',
    sections: [
      { title: 'Start with true or false', body: 'A Boolean value has just two possibilities: True and False. For example, “age is at least 12” is a condition. Once the age is known, that condition has a Boolean result.' },
      { title: 'Combine conditions with three operations', body: 'A and B requires both conditions to be true. A or B requires at least one to be true. not A reverses the result: true becomes false, and false becomes true. OR includes the case where both conditions are true. In the experiment, you can also try XOR: its result is true only when the two inputs differ.', code: 'True and False  # False\nTrue or False   # True\nnot True        # False' },
      { title: 'Make the grouping clear', body: '“Has a library card, and has borrowing space or teacher permission” could be read in different ways. Writing has_card and (has_space or teacher_permission) makes the grouping explicit: evaluate the condition in parentheses, then combine it with has_card.' }
    ],
    takeaways: ['A Boolean value represents true or false.', 'AND needs both conditions; OR needs at least one.', 'NOT reverses a value, and parentheses make grouping clear.'],
    prediction: { prompt: 'Select AND in the logic experiment, with input A = 1 and B = 0. What will the output light do?', options: ['Stay off: the output is 0', 'Turn on: the output is 1', 'There is not enough information'], answer: 0, explanation: 'AND requires both inputs to be 1. Here B is 0, so the requirement is not met and the output is 0.' },
    question: { prompt: 'A is True and B is False. What is the result of A and (not B)?', options: ['False', 'True', 'It cannot be determined', 'The numbers 1 and 0'], answer: 1, hint: 'Evaluate the parentheses first: what does not False become?', explanation: 'not B changes False to True. The expression is therefore True and True, which evaluates to True.' }
  },
  {
    id: 'algorithm', module: 'foundations', title: 'Give a problem clear instructions', summary: 'Practise decomposition and algorithms by packing a school bag.', duration: 10, tag: 'Problem decomposition', lab: null,
    intro: '“Pack your school bag” describes a goal, but it is not a complete set of instructions. To give this job to a robot that follows instructions literally, you need to be more specific.',
    sections: [
      { title: 'Define the input and the goal', body: 'The input is the information already available, such as tomorrow’s timetable and the books on your desk. The goal is to have the book needed for every lesson in the bag. Clear inputs and outputs let us check whether a method has completed the task.' },
      { title: 'Break the task into smaller steps', body: 'You could first read the timetable, find the book for each lesson, place each book in the bag, and check for anything missing. Breaking a problem into smaller, more manageable problems is called decomposition.', code: 'Read tomorrow’s list of lessons\nFor each lesson:\n    Find the matching textbook\n    Put the textbook in the bag\nCheck whether any textbooks are still missing' },
      { title: 'Plan for exceptions, too', body: 'An algorithm is a set of clear steps for solving a class of problems. “Keep looking until you find it” could run forever if a book is missing. A more complete rule is to search the specified places, record any missing book, and then continue with the other lessons.' }
    ],
    takeaways: ['First identify the input and the goal.', 'Break a large task into smaller, executable steps.', 'State how to handle exceptions and when to stop.'],
    prediction: { prompt: 'Check [blue card, red card, red card] in order. The rule is “stop at the first red card”. Which card will be selected?', options: ['The first card, which is blue', 'The third card', 'The second card'], answer: 2, explanation: 'The first card is blue, so continue. The second card is red and satisfies the stopping rule. Select it without checking the third card.' },
    question: { prompt: 'Which instruction for a bag-packing robot is the clearest and easiest to check?', options: ['Pack more carefully', 'Put in everything useful', 'Keep looking until the bag is perfect', 'Check each lesson on the timetable and pack its textbook'], answer: 3, hint: 'Can the robot tell what to do at each step and when the task is finished?', explanation: 'Checking each lesson on the timetable gives the robot a reference, something to repeat over, and a specific action. “Carefully”, “useful”, and “perfect” have no precise criteria for the robot to follow.' }
  },
  {
    id: 'variable', module: 'python', title: 'Remember a value with a variable', summary: 'Name your data and follow how it changes in a program.', duration: 12, tag: 'Variables and assignment', lab: null,
    intro: 'A scoreboard remembers the current score and updates it after a correct answer. Variables let a program use a name to find the data it needs at that moment.',
    sections: [
      { title: 'Assignment creates an association', body: 'In Python, score = 3 associates the name score with the integer 3. Here, the equals sign means assignment, not a mathematical equality test. Use == to test whether two values are equal.', code: 'score = 3\nprint(score)  # Prints 3' },
      { title: 'Evaluate the right side first', body: 'For score = score + 2, Python first reads the current value of score, adds 2, and then associates score with the new result. Descriptive names make a program easier to understand than names such as a and b.', code: 'score = 3\nscore = score + 2\nprint(score)  # Prints 5' },
      { title: 'Assignment does not create a live formula', body: 'In this integer example, backup = score associates backup with the integer value score refers to at that moment. Reassigning score later does not change backup. This is not a spreadsheet formula that keeps updating automatically.', code: 'score = 3\nbackup = score\nscore = 5\nprint(backup)  # Prints 3' }
    ],
    takeaways: ['A variable name lets a program access a value.', 'Assignment evaluates the right side before updating the name on the left.', 'Assigning an integer does not create an automatically updating formula.'],
    prediction: { prompt: 'A program runs score = 10, followed by score = score + 5. What will print(score) output next?', options: ['10', '15', '5'], answer: 1, explanation: 'Python first evaluates 10 + 5 on the right, giving 15, then updates score to refer to 15. Assignment updates the value; it is not a mathematical equality that has to hold forever.' },
    question: { prompt: 'After x = 4, y = x, and x = x + 1, what is the value of y?', options: ['5', '4', '1', 'It cannot be determined'], answer: 1, hint: 'Which integer does x refer to when y = x runs? Is y assigned again later?', explanation: 'When y = x runs, y becomes associated with the integer 4. Only x is reassigned later. Because y is not reassigned, its value is still 4.' }
  },
  {
    id: 'condition', module: 'python', title: 'Let a program make a choice', summary: 'Use if and else to handle different situations.', duration: 12, tag: 'Conditional branches', lab: null,
    intro: 'Take an umbrella when it rains; travel light when it does not. A program also needs to choose which block of code to run based on a condition.',
    sections: [
      { title: 'Run this block only when the condition is true', body: 'An if statement contains a condition and ends with a colon. The indented code below belongs to that branch and runs only when the condition is true. Python uses indentation to group statements into blocks.', code: 'raining = True\nif raining:\n    print("Take an umbrella")' },
      { title: 'Use else for the other possibility', body: 'if and else make a two-way choice: run the if branch when the condition is true, or the else branch otherwise. >= means “greater than or equal to”, so a score of exactly 60 satisfies score >= 60.', code: 'score = 60\nif score >= 60:\n    print("Pass")\nelse:\n    print("Try again")' },
      { title: 'Check multiple conditions in order', body: 'Use elif when more than two branches are needed. Python checks the conditions from top to bottom. After running the first branch whose condition is true, it skips the remaining elif and else branches in that group. When ranges overlap, their order matters.' }
    ],
    takeaways: ['if chooses a block based on whether a condition is true.', 'Indentation shows which statements belong to a branch.', 'An if / elif / else group runs only its first matching branch.'],
    prediction: { prompt: 'score = 90. The program first checks if score >= 60 and prints “Pass”, then uses elif score >= 90 to print “Excellent”. What does it actually print?', options: ['Excellent', 'Both Pass and Excellent', 'Pass'], answer: 2, explanation: 'The first condition is already true. Python prints “Pass” and skips the elif branch in the same group. To check for “Excellent” first, put the >= 90 condition before the >= 60 condition.' },
    question: { prompt: 'With score = 59, what does the example using if score >= 60 / else print?', options: ['Pass', 'Both messages', 'Try again', 'Nothing'], answer: 2, hint: 'Is 59 greater than or equal to 60? Which branch runs when the condition is false?', explanation: '59 >= 60 evaluates to False. Python skips the if block and runs the else block, printing “Try again”.' }
  },
  {
    id: 'loop', module: 'python', title: 'Let a loop handle repetition', summary: 'Iterate with for and keep a running total with an accumulator.', duration: 14, tag: 'Loops and iteration', lab: null,
    intro: 'To give a workbook to each student, you do not need a different instruction for every person. “For each student, give them one book” captures the idea of a loop.',
    sections: [
      { title: 'Take one item, then repeat', body: 'A for loop takes each item in a sequence in turn, assigns it to the loop variable, and runs the indented code. This program prints three names, one after another.', code: 'for name in ["Lin", "Chen", "Zhou"]:\n    print(name)' },
      { title: 'range does not include its stop value', body: 'range(1, 4) produces 1, 2, and 3: it includes the start value 1 but excludes the stop value 4. range(4) starts at 0 and produces 0, 1, 2, and 3. Keeping these boundaries clear helps avoid running a loop one time too many or too few.', code: 'for number in range(1, 4):\n    print(number)  # Prints 1, then 2, then 3' },
      { title: 'Build the result one step at a time', body: 'Start an accumulator at 0, then add the current number during each iteration. Initialise it outside the loop. If you reset it inside the loop, you lose the result accumulated in earlier iterations.', code: 'total = 0\nfor number in range(1, 4):\n    total = total + number\nprint(total)  # Prints 6' }
    ],
    takeaways: ['for takes each item in turn and runs the loop body.', 'range includes its start value but excludes its stop value.', 'Initialise an accumulator outside the loop and update it inside.'],
    prediction: { prompt: 'The program runs for number in range(3): print(number). What are the first and last lines of output?', options: ['0 and 2', '1 and 3', '0 and 3'], answer: 0, explanation: 'range(3) starts at 0 by default and does not include 3. The output is 0, then 1, then 2.' },
    question: { prompt: 'In the example, total starts at 0 and adds each number in range(1, 4). What is its final value?', options: ['6', '10', '4', '3'], answer: 0, hint: 'range(1, 4) does not include 4. Add the three numbers the loop actually visits.', explanation: 'The loop processes 1, 2, and 3. The running total changes from 0 → 1 → 3 → 6, so the program finally prints 6.' }
  },
  {
    id: 'search', module: 'algorithms', title: 'Binary search: rule out half at a time', summary: 'Find a target in sorted data with fewer comparisons.', duration: 15, tag: 'Search algorithms', lab: 'search',
    intro: 'Imagine guessing an integer from 1 to 100, with each guess receiving “too high” or “too low” as feedback. Starting in the middle lets you rule out about half the remaining numbers in one step.',
    sections: [
      { title: 'The data must be sorted first', body: 'Binary search relies on ascending order to rule out regions that cannot contain the target. If the target is larger than the middle value, keep searching the right half. If it is smaller, search the left half. You cannot safely discard half of an unsorted list this way.' },
      { title: 'Compare the middle and move the boundaries', body: 'Call the ends of the current range left and right. Compute the middle index with (left + right) // 2. If the middle value equals the target, the search succeeds. Otherwise, discard that middle element and the half that cannot contain the target.', code: 'Sorted list: [2, 5, 8, 12, 16, 23, 38]\nTarget: 23\nCompare the middle value, 12 → keep [16, 23, 38]\nCompare the new middle value, 23 → found it' },
      { title: 'Not found is a definite result, too', body: 'When left becomes greater than right, the candidate range is empty: the target is not in the list. Each iteration must shrink the range so the search eventually ends. If values are repeated, ordinary binary search can find a matching item, but not necessarily the first one.' }
    ],
    takeaways: ['Binary search requires sorted data.', 'Comparing the middle value rules out about half the candidates.', 'An empty range tells us that the target is absent.'],
    prediction: { prompt: 'Search for 10 in the sorted list [3, 6, 9, 12, 15]. First compare it with the middle value, 9. What happens when the next comparison is with 12?', options: ['10 is found immediately', 'Only 15 remains', 'The candidate range becomes empty and the search ends'], answer: 2, explanation: 'After comparing with 9, only [12, 15] remains. The target 10 is smaller than 12, but 9 has already been ruled out. There are no candidates left, so the search concludes that 10 is absent.' },
    question: { prompt: 'When searching for 23 in [2, 5, 8, 12, 16, 23, 38], which range remains after the first comparison with 12?', options: ['[2, 5, 8]', '[12, 16, 23, 38]', 'Keep the entire list', '[16, 23, 38]'], answer: 3, hint: '23 is larger than 12. You have already compared with 12: does it need to stay?', explanation: 'The list is sorted. Every value to the left of 12 is too small, and 12 is not the target either. Only the right-hand range [16, 23, 38] remains.' }
  },
  {
    id: 'sorting', module: 'algorithms', title: 'Watch numbers find their order', summary: 'Compare neighbours and work through a pass of bubble sort.', duration: 15, tag: 'Sorting algorithms', lab: 'sorting',
    intro: 'To arrange books of different heights, you could check neighbouring pairs and swap them whenever they are in the wrong order. Bubble sort applies a similar idea to numbers.',
    sections: [
      { title: 'Compare just two neighbours', body: 'To sort in ascending order, compare neighbouring elements from left to right. Swap them if the left value is greater than the right value; otherwise, leave them as they are. Then move to the next pair. Always continue from the updated list after a swap.' },
      { title: 'One pass moves the largest value to the right', body: 'A complete left-to-right pass moves the largest value in the unsorted region to its rightmost position. In this example, 5 is in its final position after one pass, but the values before it are not yet fully sorted.', code: '[5, 2, 4, 1]\n[2, 5, 4, 1]  # Swap 5 and 2\n[2, 4, 5, 1]  # Swap 5 and 4\n[2, 4, 1, 5]  # Swap 5 and 1' },
      { title: 'Shrink the range, and stop if nothing changes', body: 'After each pass, the rightmost value is already in place and does not need further comparisons. Continue over the remaining region. If a pass makes no swaps, the list is sorted and the algorithm can stop early. In the worst case, the number of bubble-sort comparisons grows on the order of n².' }
    ],
    takeaways: ['Compare neighbours and swap only when they are out of order.', 'One pass moves the largest unsorted value to the right.', 'A pass with no swaps lets the algorithm stop early.'],
    prediction: { prompt: 'Bubble sort [3, 1, 2] in ascending order. What does the list look like just after comparing the first pair, 3 and 1?', options: ['[1, 2, 3]', '[1, 3, 2]', '[3, 1, 2]'], answer: 1, explanation: 'Since 3 is greater than 1, swap only that pair, giving [1, 3, 2]. The next pair, 3 and 2, has not been compared yet, so the whole list is not sorted.' },
    question: { prompt: 'What is the list after one complete left-to-right pass of bubble sort on [5, 2, 4, 1]?', options: ['[1, 2, 4, 5]', '[2, 5, 4, 1]', '[2, 4, 1, 5]', '[5, 4, 2, 1]'], answer: 2, hint: 'Compare all three neighbouring pairs in order. Each swap moves 5 one position to the right.', explanation: 'The pass swaps 5 with 2, then 5 with 4, then 5 with 1, leaving [2, 4, 1, 5]. One pass places the largest value correctly; it does not necessarily sort the entire list.' }
  },
  {
    id: 'complexity', module: 'algorithms', title: 'More data: how much more work?', summary: 'Compare growth patterns, rather than just one running time.', duration: 12, tag: 'Time complexity', lab: null,
    intro: 'Looking through ten cards one at a time is easy. With a hundred thousand cards, the same method may feel slow. We need to ask how an algorithm’s work grows with the amount of data.',
    sections: [
      { title: 'Decide what you are counting', body: 'When comparing search algorithms, you can count comparisons with the target. Actual running time also depends on the device and implementation. Counting operations helps reveal the growth pattern. A worst-case analysis considers the least favourable input.' },
      { title: 'Three common growth patterns', body: 'Linear search may need to inspect all n elements in the worst case: O(n). Binary search cuts the range roughly in half each time, so its worst-case comparison count grows logarithmically: O(log n). Bubble sort needs O(n²) comparisons in the worst case. Big O describes the order of growth, not an exact number of seconds.', code: 'When the input size doubles, consider the trend at larger sizes:\nO(n)      → roughly twice as much work\nO(log n)  → binary search usually needs about one extra round\nO(n²)     → roughly four times as much work' },
      { title: 'A better growth rate still has conditions', body: 'Binary search needs sorted data, and sorting has a cost if you only want to search once. For small inputs, constant overheads may matter more. When choosing an algorithm, consider the data, any preparation needed, and how many times the operation will be repeated.' }
    ],
    takeaways: ['Compare how work grows, not just one measured running time.', 'Common growth rates include O(log n), O(n), and O(n²).', 'Consider preparation costs and the properties of the data, too.'],
    prediction: { prompt: 'Linear search is looking for a target that is absent. If the list grows from 100 elements to 300, by what factor does the worst-case number of inspected elements grow?', options: ['3 times', '9 times', 'Only about one extra comparison'], answer: 0, explanation: 'When the target is absent, linear search inspects every element. The count rises from 100 to 300, exactly three times as many: an example of linear growth.' },
    question: { prompt: 'If sorted data grows from 1,000 to 2,000 elements, approximately how does the worst-case comparison count for binary search change?', options: ['It roughly doubles', 'It increases by about 1', 'It roughly quadruples', 'It stays exactly the same'], answer: 1, hint: 'When the input doubles, one more halving brings you back to the original size.', explanation: 'Binary search has logarithmic growth. Doubling the input adds about one comparison in the worst case, unlike the proportional growth of inspecting elements one by one.' }
  }
];

// IDs stay identical across languages so remembered cards survive a language switch.
export const glossary = [
  { id: '比特', term: 'Bit', english: 'binary digit', definition: 'One binary digit, with a value of either 0 or 1.', lesson: 'binary' },
  { id: '二进制', term: 'Binary', english: 'base two', definition: 'A number system with base 2, using only the digits 0 and 1.', lesson: 'binary' },
  { id: '位权', term: 'Place value', english: 'positional weight', definition: 'The weight of a digit’s position. In binary, the weights from right to left are 1, 2, 4, 8, and so on.', lesson: 'binary' },
  { id: '布尔值', term: 'Boolean value', english: 'True or False', definition: 'A value with only two possibilities, written as True and False in Python.', lesson: 'logic' },
  { id: '算法', term: 'Algorithm', english: 'a precise procedure', definition: 'A set of clear, executable steps for solving a class of problems.', lesson: 'algorithm' },
  { id: '问题分解', term: 'Decomposition', english: 'breaking a problem down', definition: 'Breaking a large problem into smaller problems that are easier to handle.', lesson: 'algorithm' },
  { id: '变量', term: 'Variable', english: 'a name for accessing a value', definition: 'A name that a program uses to refer to and access a value.', lesson: 'variable' },
  { id: '赋值', term: 'Assignment', english: 'associating a name with a value', definition: 'Associating a value with a variable name. Python uses a single equals sign for assignment.', lesson: 'variable' },
  { id: '条件分支', term: 'Conditional branch', english: 'choosing a code path', definition: 'A code path chosen according to whether a condition is true or false.', lesson: 'condition' },
  { id: '循环', term: 'Loop', english: 'repeated execution', definition: 'A structure that repeats a block of code according to a rule.', lesson: 'loop' },
  { id: '二分查找', term: 'Binary search', english: 'halving the search range', definition: 'A method for searching sorted data by comparing with the middle value and ruling out about half the candidates each time.', lesson: 'search' },
  { id: '时间复杂度', term: 'Time complexity', english: 'how work grows', definition: 'A description of how an algorithm’s operation count grows with the input size, commonly expressed using Big O.', lesson: 'complexity' }
];

export const sources = [
  { title: 'Boxi Yu · Interactive course notes', url: 'https://boxiyu.github.io/courses/', note: 'The main reference for step-by-step exploration, predicting before revealing, and end-of-lesson checks.' },
  { title: 'AIE1001 · Computers and number systems', url: 'https://boxi-cs.github.io/aie1001/L01/', note: 'A reference for short sections, editable number-system experiments, takeaways, and exercises at different levels.' },
  { title: 'Data Structures · Complexity and proof methods', url: 'https://boxi-cs.github.io/data-structures/L01/', note: 'A reference for concept maps, execution traces, predictions, and chapter-end understanding checks.' },
  { title: 'CS50 · From concepts to practice', url: 'https://cs50.harvard.edu/x/', note: 'A reference for organising learning into modules with practice and projects.' },
  { title: 'CS61A · Lectures and labs', url: 'https://cs61a.org/fa26/syllabus/', note: 'A reference for connecting explanations, hands-on labs, and understanding checks.' },
  { title: 'VisuAlgo · Watch algorithms run', url: 'https://visualgo.net/en/sorting', note: 'A reference for step controls, custom inputs, and explanations of each execution step.' },
  { title: 'Exercism · Practice with feedback', url: 'https://exercism.org/docs/using/feedback', note: 'A reference for timely, specific feedback that helps learners decide what to try next.' }
];

export const furtherCourses = [
  { title: 'AIE1001 · Introduction to AI Programming', level: 'University introduction', description: 'External course notes: explore computers, number systems, Python, recursion, object-oriented programming, and AI applications.', url: 'https://boxi-cs.github.io/aie1001/' },
  { title: 'Data Structures', level: 'University core', description: 'External course notes: explore arrays, linked lists, trees, hash tables, and graphs, with Python and Java versions.', url: 'https://boxi-cs.github.io/data-structures/' },
  { title: 'CSC4801 · AI-assisted Software Engineering', level: 'University advanced', description: 'External course notes: understand large language models and agents, then use them for requirements, coding, testing, and teamwork.', url: 'https://boxi-cs.github.io/csc4801/' }
];
