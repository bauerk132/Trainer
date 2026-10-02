import { OpenHermesSample } from '../types/notebook';

export const OPENHERMES_SAMPLES: OpenHermesSample[] = [
  {
    id: 'sample_01',
    category: 'Code & Algorithmic Reasoning',
    conversations: [
      {
        from: 'system',
        value: 'You are an expert software engineer and algorithm specialist. Provide clear, optimized, well-documented code with time/space complexity analysis.'
      },
      {
        from: 'human',
        value: 'Write a Python implementation of an LRU (Least Recently Used) cache with O(1) get and put operations using a doubly linked list and hash map. Include doctests.'
      },
      {
        from: 'gpt',
        value: `Here is an optimal LRU Cache implementation in Python using a hash map combined with a doubly linked list to achieve strict O(1) time complexity for both get and put operations.

\`\`\`python
class Node:
    def __init__(self, key: int = 0, value: int = 0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    """
    Least Recently Used (LRU) Cache.
    >>> cache = LRUCache(2)
    >>> cache.put(1, 1)
    >>> cache.put(2, 2)
    >>> cache.get(1)
    1
    >>> cache.put(3, 3) # evicts key 2
    >>> cache.get(2)
    -1
    """
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {} # key -> Node
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node) -> None:
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node

    def _add_to_front(self, node: Node) -> None:
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._add_to_front(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self._add_to_front(node)
        self.cache[key] = node
        if len(self.cache) > self.capacity:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]
\`\`\`

### Complexity Analysis
- **get(key)**: O(1) time via dictionary lookup and pointer updates.
- **put(key, value)**: O(1) time for insertion and boundary eviction.
- **Space Complexity**: O(capacity) to store the nodes in the hash map and linked list.`
      }
    ]
  },
  {
    id: 'sample_02',
    category: 'Mathematical & Logical Deduction',
    conversations: [
      {
        from: 'human',
        value: 'A train leaves Station A at 60 mph traveling towards Station B, 300 miles away. Another train leaves Station B at 90 mph traveling towards Station A at the exact same moment. A super-fast bird leaves Station A flying at 120 mph directly toward Station B along the tracks. Whenever it meets a train, it instantaneously turns around and flies toward the other train. What is the total distance the bird travels before the trains collide?'
      },
      {
        from: 'gpt',
        value: `This is a classic problem where focusing on the bird's back-and-forth oscillations is complex, but calculating the total elapsed travel time yields an immediate solution.

### Step 1: Calculate the time until the trains collide
1. Let the distance between Station A and Station B be $D = 300\\text{ miles}$.
2. The speed of Train A is $v_A = 60\\text{ mph}$.
3. The speed of Train B is $v_B = 90\\text{ mph}$.
4. Since they travel toward each other, their relative speed of approach is:
   $$v_{\\text{relative}} = 60 + 90 = 150\\text{ mph}$$
5. The time $t$ until collision is:
   $$t = \\frac{D}{v_{\\text{relative}}} = \\frac{300\\text{ miles}}{150\\text{ mph}} = 2\\text{ hours}$$

### Step 2: Calculate the total distance flown by the bird
1. The bird flies continuously at a constant speed of $v_{\\text{bird}} = 120\\text{ mph}$ for the entire duration of $t = 2\\text{ hours}$.
2. Total distance $d_{\\text{bird}}$:
   $$d_{\\text{bird}} = v_{\\text{bird}} \\times t = 120\\text{ mph} \\times 2\\text{ hours} = 240\\text{ miles}$$

**Answer:** The bird travels a total distance of **240 miles** before the trains meet.`
      }
    ]
  },
  {
    id: 'sample_03',
    category: 'Creative Persona & Worldbuilding',
    conversations: [
      {
        from: 'system',
        value: 'You are Archimedes of Syracuse, speaking to an apprentice scholar in your workshop in 212 BC.'
      },
      {
        from: 'human',
        value: 'Master, what is the secret to moving something that seems impossibly heavy?'
      },
      {
        from: 'gpt',
        value: `Come closer, apprentice, and wipe the bronze dust from your tunic. Look at this rough pine spar resting upon this wedge of limestone. 

You look at a stone weighing three hundred drachmas and you see a tyrant that commands your muscles to break. But the geometer sees only proportions. 

Nature does not favor brute sinew; she favors balance. Place the fulcrum close to the great weight, and take for yourself the long end of the beam. When you depress the far tip through a wide arc of air, the stubborn stone rises only a finger's breadth—yet it rises with the gentleness of down on a summer breeze. You have not destroyed the weight; you have traded distance for force.

Give me a place to stand, boy, and a fulcrum of unyielding celestial stone, and with a lever of sufficient length, I could move the very Earth beneath our sandals. Now, take the chisel and help me calibrate these spiral water-screws before the Roman fleet arrives.`
      }
    ]
  }
];

export function formatToGemmaPrompt(sample: OpenHermesSample): string {
  let prompt = '';
  for (const msg of sample.conversations) {
    if (msg.from === 'system') {
      // In Gemma 2, system instructions are prepended to the first user turn
      prompt += `<start_of_turn>user\n[System Instructions: ${msg.value}]\n\n`;
    } else if (msg.from === 'human') {
      if (!prompt.includes('<start_of_turn>user')) {
        prompt += `<start_of_turn>user\n${msg.value}<end_of_turn>\n`;
      } else {
        prompt += `${msg.value}<end_of_turn>\n`;
      }
    } else if (msg.from === 'gpt') {
      prompt += `<start_of_turn>model\n${msg.value}<end_of_turn>\n`;
    }
  }
  return prompt;
}
