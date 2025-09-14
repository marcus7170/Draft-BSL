#  Sistema de Draft MD3 - Standalone
https://marcus7170.github.io/Draft-BSL/
Uma ferramenta de draft standalone, 100% frontend, criada para gerenciar a montagem de times no formato MD3 de forma rápida, local e eficiente, sem a necessidade de um backend ou banco de dados.

<img width="741" height="611" alt="image" src="https://github.com/user-attachments/assets/c2319fef-cb65-4505-a07a-81738be275b7" />


Este projeto foi desenvolvido para simplificar o processo de draft, transformando uma tarefa complexa e manual em uma experiência interativa e automatizada. Toda a lógica de processamento da lista de jogadores, seleção de capitães, sorteio e escolhas acontece diretamente no navegador do usuário, garantindo portabilidade e facilidade de uso.

Basta abrir o arquivo `index.html` em qualquer navegador moderno para começar.

## Principais Funcionalidades

* ✅ **Processamento Local:** Cole a lista de jogadores no formato especificado e o sistema cuida do resto.
* ✅ **Seleção de Capitães:** Interface dedicada para a escolha manual ou preenchimento automático dos capitães dos times.
* ✅ **Auto-Posicionamento de Capitães:** Após o sorteio, os capitães são automaticamente alocados em suas posições secundárias, agilizando o início do draft.
* ✅ **Sorteio da Ordem:** Uma animação de loteria determina a ordem de escolha da primeira rodada.
* ✅ **Lógica de Draft "Snake":** A ordem de escolha é invertida a cada rodada para garantir um draft balanceado.
* ✅ **Filtros por Posição:** Filtre a lista de jogadores disponíveis por posição (GK, ZAG, VOL, etc.) com um clique.
* ✅ **Controles de Administrador:** Pause, reverta a última escolha, pule um turno ou resete o draft a qualquer momento.
* ✅ **Edição em Tempo Real:** Edite o nome dos times e dos jogadores escolhidos diretamente na tela do draft.
* ✅ **Responsividade e Performance:** Otimizado para rodar de forma fluida, mesmo com centenas de jogadores, e se adapta a diferentes tamanhos de tela.

## Tecnologias Utilizadas

O projeto é construído apenas com tecnologias web fundamentais, garantindo máxima compatibilidade e leveza.

* **HTML5**
* **CSS3** (com Flexbox, Grid e Variáveis)
* **JavaScript (ES6+)**

## Como Executar

Este projeto não requer instalação de pacotes ou um servidor web.

1.  Faça o clone ou baixe o ZIP deste repositório.
    ```
    git clone [https://github.com/USER/REPO.git](https://github.com/USER/REPO.git)
    ```
2.  Certifique-se de que os arquivos de imagem (`logo.png` e `qr_code.png`) estejam na mesma pasta que o `index.html`.
3.  Abra o arquivo `index.html` no seu navegador de preferência (Google Chrome, Firefox, etc.).
4.  Pronto! O sistema de draft está pronto para ser usado.

## Modo de Uso

1.  **Início:** Na tela inicial, clique em "Iniciar Draft MD3".
2.  **Registro de Jogadores:** Cole a sua lista de jogadores na área de texto, seguindo o formato `POSICAO: NOME_DO_JOGADOR`. Jogadores em destaque podem ser marcados com um asterisco (`*`).
3.  **Setup dos Times:** Defina o número de times e escolha os capitães para cada um, ou use o preenchimento automático.
4.  **Sorteio:** Clique em "Sortear Ordem do Draft" para iniciar a loteria.
5.  **O Draft:** Após a animação, os capitães serão posicionados automaticamente e o draft começará na segunda rodada. Siga as instruções na tela para escolher os jogadores para o time da vez.

## Autor

**Marcus7170**

* Apoie o desenvolvimento através do QR Code no rodapé da aplicação.

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
