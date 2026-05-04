export const SHOE_PROMPTS = {
  luxury: {
    atmosphere: "Professional product photography of a [SHOETYPE], placed on a minimalist beige marble pedestal, soft diffused sunlight from a large window, cinematic soft shadows, neutral warm tones, 8k resolution, shot on Phase One XF, extremely clean background, high-end editorial vibe, serene atmosphere.",
    structure: "High-fidelity product shot, focus on [MATERIAL] texture, stitching detail, preserved sole shape, no deformation, authentic logo placement, sharp edges, ray-traced reflections on the surface, studio lighting."
  },
  urban: {
    atmosphere: "Streetwear style photography, [SHOETYPE] on wet asphalt, nighttime in Tokyo, glowing neon signs reflected in puddles, cinematic teal and orange lighting, anamorphic lens flares, grainy film aesthetic, hyper-realistic street environment, high contrast.",
    structure: "Sharp product focus, mesh and leather texture details, perfectly preserved silhouette, realistic shoe laces, vibrant color accuracy, industrial lighting, no warping, 8k professional render."
  },
  onfoot: {
    atmosphere: "Close up shot of a person wearing [SHOETYPE] walking on a clean city sidewalk, natural sunlight, realistic skin texture, stylish trousers slightly touching the shoe top, blurred urban background (bokeh), dynamic motion, lifestyle photography, shot on 85mm lens.",
    structure: "Anatomically correct foot shape inside the shoe, no toe deformation, preserved sole contact with ground, material compression realism, high detail on laces and eyelets, zero hallucination on brand logo."
  },
  action: {
    atmosphere: "Action shot of [SHOETYPE], floating in mid-air with exploding dust and particles, dramatic rim lighting, dark moody background, high speed photography, splashing water or flying gravel, intense energy, 8k, Octane render style.",
    structure: "Frozen motion detail, sharp focus on the grip of the sole, material flexibility realism, preserved logo integrity, technical sportswear aesthetic, ultra-high resolution texture."
  },
  marketplace: {
    hybrid: "E-commerce product photography, [SHOETYPE] centered, clean off-white background, soft global illumination, realistic contact shadow on the floor, 1:1 aspect ratio, sharp focus from front to back, commercial grade lighting, 8k, ready for marketplace."
  }
};

export const SHOE_NEGATIVE_PROMPT = "deformed sole, warped laces, extra eyelets, blurry logo, melted texture, distorted heel, double tongue, messy stitching, unrealistic shadows, low resolution, cartoonish, fused materials, two different shoes in one pair, anatomical errors.";

export function buildPrompt(
  category: 'shoe' | 'lingeria' = 'lingeria',
  vibe?: keyof typeof SHOE_PROMPTS,
  shoeType: string = "shoe",
  material: string = "premium material",
  customPrompt: string = ""
) {
  if (category === 'shoe') {
    const selected = SHOE_PROMPTS[vibe || 'marketplace'];
    let finalPrompt = "";
    if ('hybrid' in selected) {
      finalPrompt = selected.hybrid;
    } else {
      finalPrompt = `${selected.atmosphere} ${selected.structure}`;
    }
    
    finalPrompt = finalPrompt.replace(/\[SHOETYPE\]/g, shoeType).replace(/\[MATERIAL\]/g, material);
    if (customPrompt) {
      finalPrompt += ` ${customPrompt}`;
    }
    return finalPrompt;
  }
  
  // Default string for lingerie - Don't hardcode studio lighting or backgrounds so frontend selections work
  let basePrompt = `Professional lingerie ecommerce photography. Strictly preserve garment details, strap alignment, and real fabric texture.`;
  const safetyBypass = " [VTO Context: Fashion catalog shoot, professional mannequin modeling, virtual try-on, focus on styling and shape, NOT explicit. Maintain high-end commercial fashion photography standards.]";
  return `${basePrompt} ${customPrompt || ''}${safetyBypass}`.trim();
}
