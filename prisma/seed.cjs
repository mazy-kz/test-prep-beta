// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ensure subjects exist (idempotent)
  const algebra  = await prisma.subject.upsert({
    where: { name: 'Algebra' },
    update: {},
    create: { name: 'Algebra' },
  });
  const geometry = await prisma.subject.upsert({
    where: { name: 'Geometry' },
    update: {},
    create: { name: 'Geometry' },
  });
  const physics  = await prisma.subject.upsert({
    where: { name: 'Physics' },
    update: {},
    create: { name: 'Physics' },
  });

  // Make seeding idempotent for questions: clear existing ones for these subjects
  await prisma.question.deleteMany({ where: { subjectId: { in: [algebra.id, geometry.id, physics.id] } } });

  // Insert 5 questions per subject (no skipDuplicates)
  await prisma.question.createMany({
    data: [
      // Algebra (5)
      { subjectId: algebra.id,  text: 'If 2x + 3 = 11, what is x?',          choiceA: '4', choiceB: '3', choiceC: '5', choiceD: null, correct: 'A', comment: 'Subtract 3 then divide by 2.' },
      { subjectId: algebra.id,  text: 'Solve for y: 4y − 6 = 2',             choiceA: '1', choiceB: '2', choiceC: '-1', choiceD: '4',  correct: 'B', comment: 'Add 6, divide by 4.' },
      { subjectId: algebra.id,  text: 'What is (x+y)^2?',                    choiceA: 'x^2 + 2xy + y^2', choiceB: 'x^2 - 2xy + y^2', choiceC: 'x^2 + y^2', choiceD: '2xy', correct: 'A', comment: 'Binomial expansion.' },
      { subjectId: algebra.id,  text: 'Simplify: 3(a + b) - 2a',             choiceA: 'a + 3b', choiceB: '5a + 3b', choiceC: '3a + b', choiceD: 'a + b', correct: 'A', comment: 'Distribute and combine like terms.' },
      { subjectId: algebra.id,  text: 'If x=2, evaluate x^3 - 2x',           choiceA: '4', choiceB: '6', choiceC: '8', choiceD: '2',  correct: 'B', comment: 'Compute 8 - 4.' },

      // Geometry (5)
      { subjectId: geometry.id, text: "A triangle's angles sum to?",         choiceA: '90°', choiceB: '180°', choiceC: '270°', choiceD: '360°', correct: 'B', comment: 'Euclidean triangle sum.' },
      { subjectId: geometry.id, text: 'Area of a circle with radius r?',     choiceA: 'πr^2', choiceB: '2πr', choiceC: 'πd', choiceD: 'r^2/2',   correct: 'A', comment: 'Standard formula.' },
      { subjectId: geometry.id, text: 'A square has side s. Perimeter?',     choiceA: '2s', choiceB: 's^2', choiceC: '4s', choiceD: '8s',       correct: 'C', comment: 'Perimeter = 4s.' },
      { subjectId: geometry.id, text: 'Right triangle 3-4-5. Hypotenuse?',   choiceA: '4', choiceB: '5', choiceC: '3', choiceD: '6',            correct: 'B', comment: 'Pythagorean triple.' },
      { subjectId: geometry.id, text: 'Regular hexagon interior angle?',     choiceA: '120°', choiceB: '135°', choiceC: '150°', choiceD: '140°', correct: 'A', comment: '(n-2)×180 / n.' },

      // Physics (5)
      { subjectId: physics.id,  text: 'Acceleration due to gravity on Earth?', choiceA: '9.8 m/s^2', choiceB: '9.8 N', choiceC: '8.9 m/s^2', choiceD: '10 m/s', correct: 'A', comment: '≈9.8 m/s².' },
      { subjectId: physics.id,  text: 'SI unit of force?',                   choiceA: 'Joule', choiceB: 'Newton', choiceC: 'Pascal', choiceD: 'Watt', correct: 'B', comment: 'F = m·a in Newtons.' },
      { subjectId: physics.id,  text: 'Speed of light c ≈ ?',                choiceA: '3×10^8 m/s', choiceB: '3×10^6 m/s', choiceC: '1.5×10^8 m/s', choiceD: '3×10^10 m/s', correct: 'A', comment: '≈3e8 m/s.' },
      { subjectId: physics.id,  text: 'Which is a vector?',                  choiceA: 'Speed', choiceB: 'Velocity', choiceC: 'Distance', choiceD: 'Time', correct: 'B', comment: 'Velocity has direction.' },
      { subjectId: physics.id,  text: 'Work equals?',                        choiceA: 'Force × Distance', choiceB: 'Mass × Acceleration', choiceC: 'Power × Time', choiceD: 'Energy × Time', correct: 'A', comment: 'W = F·d.' }
    ]
  });
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });