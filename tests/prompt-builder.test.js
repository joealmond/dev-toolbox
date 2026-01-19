const { buildPrompt } = require('../scripts/utils/prompt-builder');

describe('buildPrompt', () => {
  it('includes requirements and architecture for spec tasks', () => {
    const fm = {
      title: 'Spec Task',
      spec: {
        enabled: true,
        requirements: ['Req A', 'Req B'],
        architecture: {
          components: ['Comp1'],
          integrations: ['ServiceX'],
          decisions: 'Use pattern Y'
        }
      },
      acceptanceCriteria: ['AC1']
    };

    const prompt = buildPrompt(fm, 'Body text', []);
    expect(prompt).toMatch(/Requirements/);
    expect(prompt).toMatch(/Architecture Context/);
    expect(prompt).toMatch(/Comp1/);
    expect(prompt).toMatch(/ServiceX/);
    expect(prompt).toMatch(/Use pattern Y/);
    expect(prompt).toMatch(/Acceptance Criteria/);
    expect(prompt).toMatch(/Body text/);
  });

  it('includes description and priority for non-spec tasks', () => {
    const fm = {
      title: 'Normal Task',
      description: 'Do something',
      priority: 'high',
      acceptanceCriteria: ['AC1', 'AC2']
    };

    const prompt = buildPrompt(fm, 'Details', []);
    expect(prompt).toMatch(/Normal Task/);
    expect(prompt).toMatch(/Description/);
    expect(prompt).toMatch(/Priority/);
    expect(prompt).toMatch(/Acceptance Criteria/);
    expect(prompt).toMatch(/Details/);
  });
});
