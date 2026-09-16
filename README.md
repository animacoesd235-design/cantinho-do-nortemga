# Cantinho Digital

Crie um aplicativo web de cardápio online ultra-rápido, mobile-first e moderno para o "Cantinho do Norte - Açaí e Empório" (Maringá/PR). 

1. IDENTIDADE VISUAL E DESIGN:

- Estilo amazônico refinado e natural: fundo em tons de bege craft/areia suave, detalhes em verde floresta profundo e destaques no roxo autêntico do açaí e amarelo dourado (referência às farinhas artesanais).

- Layout limpo, moderno e otimizado para celulares, utilizando Tailwind CSS e ícones do Lucide.

- Cabeçalho imersivo com o logotipo/título "Cantinho do Norte", o selo "O autêntico Açaí da Amazônia em Maringá — Sem misturas!" e informações de atendimento.

- Sistema de abas fluidas no topo para navegar entre: "Cardápio & Açaí", "Monte seu Bowl" e "Empório do Norte".

2. FUNCIONALIDADES DE MÍDIA E PERFORMANCE (OBRIGATÓRIO):

- **Upload Local de Mídia:** Cada card de produto deve possuir um botão discreto de edição/upload (ícone de câmera/vídeo) para que o lojista possa carregar fotos e vídeos diretamente do seu dispositivo. As mídias alteradas devem ser salvas no 'localStorage' do navegador.

- **Alternância Foto/Vídeo:** Cada item do cardápio suporta foto estática em alta resolução e vídeo em loop automático (`autoPlay loop muted playsInline`) para gerar desejo imediato nos clientes ao ver o açaí e os pratos.

- **Performance Extrema:** Carregamento instantênseo, lazy loading em todas as mídias e transições entre abas abaixo de 100ms.

3. SEÇÃO 1: "PRATOS & COMBOS DO NORTE" (Exibir com fotos/vídeos, descrição e botão de adicionar):

- Açaí com Camarão Tradicional — R$ 34,90 (O autêntico açaí grosso da Amazônia servido com camarão seco selecionado, azeite e farinha do norte)

- Bowl Amazônico Puro — R$ 22,90 (Açaí 100% puro da Amazônia, sem xarope de guaraná artificial, batido na hora, cremoso e natural)

- Açaí com Cupuaçu — R$ 26,90 (A combinação perfeita do açaí puro com o creme cremoso de cupuaçu legítimo da Amazônia)

- Combo Pará-Maringá — R$ 49,90 (Açaí grande (500ml) + porção extra de camarão seco + mix de farinhas artesanais do norte)

4. SEÇÃO 2: "MONTE SEU AÇAÍ / BOWL" (Passo a passo interativo):

- Passo 1 (Tamanho): P (300ml), M (500ml), G (700ml).

- Passo 2 (Base/Creme): Açaí Puro da Amazônia, Meio Açaí / Meio Cupuaçu, Açaí com Creme de Castanha.

- Passo 3 (Adicionais doces - Até 3): Leite Condensado, Leite em Pó, Granola Crocante, Paçoca, Banana em rodelas, Morango.

- Passo 4 (Toques do Norte - Opcional): Camarão Seco, Farinha d'Água, Farinha de Tapioca, Castanha do Pará triturada.

5. SEÇÃO 3: "EMPÓRIO DO NORTE" (Produtos para levar para casa):

- Farinha d'Água do Pará (1kg) — R$ 24,90

- Farinha de Tapioca / Ojon (500g) — R$ 19,90

- Camarão Seco Salgado Selecionado (250g) — R$ 39,90

- Tucupi Autêntico da Amazônia (Garrafa 1L) — R$ 28,90

6. RECURSOS TECNOLÓGICOS E CHECKOUT:

- Carrinho flutuante com efeito glassmorphism (`backdrop-blur-md`), contador dinâmico e subtotal em tempo real.

- Botão de "Finalizar Pedido via WhatsApp" que formata uma mensagem limpa e organizada com todos os itens, escolhas e valor total para envio direto ao número de atendimento.

- Toasts de notificação flutuantes minimalistas e micro-interações táteis em todos os botões.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cantinho-go-fast.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/96cb3a4b-e6b0-4316-95f1-d281d39e4937).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
