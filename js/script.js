const canvas = document.querySelector('#canvas1')
const ctx = canvas.getContext('2d')
canvas.width = 900
canvas.height = 600

/*
****************************Cubes vert contre cubes rouge ! *******************************************
Organisation : 
    Variables globales <= Tout ce qui va me servir dans de nombreux endroits 

    Aire de jeu <= Sans aire de jeu, pas de jeu

    Projectiles <= Les projectiles doivent être disponnible pour les defenseurs ils sont donc en haut!

    Defenseurs <= Les defenseurs sont posé sur un tile du jeu par l'utilisateur.
                  Si un ennemi marche vers lui, il tire un projectile. Sinon il attend patiement.
                  Ils ont un montant de points de vie qui va descendre si un ennemi arrive au corps a corps.
                  Ils ont également un coût pour limiter leur nombre sur le terrain.


    Attaquants <= Les attaquants sont très bêtes, ils avancent simplement tout droit.
                  Si ils arrivent en contact avec la fin de l'aire de jeu, c'est perdu.

    ressources <= Le joueur aura besoin de ressources pour poser un défenseur. 
                  Il en gagnera le long du temps et aussi en battant des ennemis.

    Fonctions Globales <= Détection des collisions
                          Utilitaires 
**********************************************************************************************************       
*/

/*                               Variables globales                           */

const jaune = '#f7ff3c' //Jaune citron
const tailleCase = 100  //A adapter a la taille de la grille de jeu
const espaceEntreCases = 3 // Ca me servira demain a corriger un bug qui crée des collisions impromptues
const zoneDeJeu = [] //tableau contenant tous les objets Cases
let projectiles = []// Pareil mais tous les projectiles
let defenseurs = []// Pareil mais tous les defenseurs
let attaquants = []//..
let positionAttaquants = []
let tableauRessources = []
let valeurRessource = [15,20,25]
let nbFrameEntreAttaquants = 800 // Ajuste le niveau de difficulté (vitesse d'apparition)
let ressources = 200 // ressources de depart
let score = 0
let frame = 0 // ce compteur me sert a temporiser les divers élements du jeu
let gameOver = false // Good Luck !
let youWin = 100
let niveau= 1

// Je définis la souris et sa position 
const souris = {
    x :10,
    y: 10,
    width : 0.1, // j'en ai besoin pour les collisions (effet de surlignement de la case survolee)
    height : 0.1,// idem
}


//Je definis la position du canvas pour pouvoir délimiter la zone de jeu dans une variable pour que les valeurs de la position de ma souris quand je suis par dessus le canvas soit bonne.

// Methode du DOM Element.getBoundingClientRect() retourne un objet DOMRect fournissant des informations sur la taille d'un élément et sa position relative par rapport à la zone d'affichage.

let monCanvasEstIci = canvas.getBoundingClientRect()

/*
console.log(monCanvasEstIci) donne un objet qui contient :

bottom: 747.5833282470703
height: 600
left: -60.22222137451172
right: 839.7777786254883
top: 147.5833282470703
width: 900
x: -60.22222137451172
y: 147.5833282470703

*/

//on veut savoir ou se trouve la souris quand elle survole le canvas ! 
canvas.addEventListener('mousemove',function(e){
    souris.x = e.x - monCanvasEstIci.left // j'ai la position x de ma souris par rapport a mon canvas quand je le survole
    souris.y = e.y - monCanvasEstIci.top // j'ai la position y de ma souris par rapport a mon canvas quand je le survole (je prend top car l'axe y est inversé par rapport aux mathématiques)
})
//on veut reset la souris quand elle sort du canvas (Sinon ça bug et décalle ma position et c'est pénible)

canvas.addEventListener('mouseleave',function(e){ 
    souris.x = undefined // Si tu sors je te connais plus !
    souris.y = undefined 
})

/*                                Zone de jeu                                */
const barreDuHaut = {
    width : canvas.width,
    height : tailleCase,
}
// On veut construire une zone de jeu ou on puisse poser des defenseurs sur des lignes,
//On va donc definir ce qu'est une case et les construire.
class Case {  
    constructor(x,y){
        this.x = x
        this.y = y
        this.width = tailleCase
        this.height = tailleCase 
    }
    afficheUneCase(){ // On veut des cases
        if(collision(this,souris) && souris.x && souris.y){
            ctx.strokeStyle = 'black' //Stroke c'est les contours des elements
            ctx.strokeRect(this.x, this.y,this.width,this.height) // du coup ici on affiche que le contours.
        }
        
    }

}


//(On a deux boucles pour construire une ligne puis passer a la ligne et reconstruire une autre ligne etc)
//On se place sur la deuxième ligne du Canvas (il y a la barre d'info et de controle en haut)
function construitLaZoneDejeu(){
    for (let y = tailleCase; y < canvas.height; y += tailleCase){// on descend d'une case a chaque passage 
        for (let x = 0; x < canvas.width; x+= tailleCase){ //On se déplace sur la ligne du canvas 
           zoneDeJeu.push(new Case(x,y))// On utilise push pour creer une nouvelle case dans le tableau qui nous sert de zone de jeu (chaque index du tableau aura une case à l'interieur)
        } 
    }
}
construitLaZoneDejeu()
/* Ceci est mon PATTERN :
console.log(zoneDeJeu)  
0: Case {x: 0, y: 100, width: 100, height: 100}
1: Case {x: 100, y: 100, width: 100, height: 100}
2: Case {x: 200, y: 100, width: 100, height: 100}
3: Case {x: 300, y: 100, width: 100, height: 100}
4: Case {x: 400, y: 100, width: 100, height: 100}
5: Case {x: 500, y: 100, width: 100, height: 100}
6: Case {x: 600, y: 100, width: 100, height: 100}
7: Case {x: 700, y: 100, width: 100, height: 100}
8: Case {x: 800, y: 100, width: 100, height: 100}
9: Case {x: 0, y: 200, width: 100, height: 100}
10: Case {x: 100, y: 200, width: 100, height: 100}
11: Case {x: 200, y: 200, width: 100, height: 100}
12: Case {x: 300, y: 200, width: 100, height: 100}
13: Case {x: 400, y: 200, width: 100, height: 100}
14: Case {x: 500, y: 200, width: 100, height: 100}
15: Case {x: 600, y: 200, width: 100, height: 100}
16: Case {x: 700, y: 200, width: 100, height: 100}
17: Case {x: 800, y: 200, width: 100, height: 100}
18: Case {x: 0, y: 300, width: 100, height: 100}
19: Case {x: 100, y: 300, width: 100, height: 100}
20: Case {x: 200, y: 300, width: 100, height: 100}
21: Case {x: 300, y: 300, width: 100, height: 100}
22: Case {x: 400, y: 300, width: 100, height: 100}
23: Case {x: 500, y: 300, width: 100, height: 100}
24: Case {x: 600, y: 300, width: 100, height: 100}
25: Case {x: 700, y: 300, width: 100, height: 100}
26: Case {x: 800, y: 300, width: 100, height: 100}
27: Case {x: 0, y: 400, width: 100, height: 100}
28: Case {x: 100, y: 400, width: 100, height: 100}
29: Case {x: 200, y: 400, width: 100, height: 100}
30: Case {x: 300, y: 400, width: 100, height: 100}
31: Case {x: 400, y: 400, width: 100, height: 100}
32: Case {x: 500, y: 400, width: 100, height: 100}
33: Case {x: 600, y: 400, width: 100, height: 100}
34: Case {x: 700, y: 400, width: 100, height: 100}
35: Case {x: 800, y: 400, width: 100, height: 100}
36: Case {x: 0, y: 500, width: 100, height: 100}
37: Case {x: 100, y: 500, width: 100, height: 100}
38: Case {x: 200, y: 500, width: 100, height: 100}
39: Case {x: 300, y: 500, width: 100, height: 100}
40: Case {x: 400, y: 500, width: 100, height: 100}
41: Case {x: 500, y: 500, width: 100, height: 100}
42: Case {x: 600, y: 500, width: 100, height: 100}
43: Case {x: 700, y: 500, width: 100, height: 100}
44: Case {x: 800, y: 500, width: 100, height: 100}
*/

//Cette fonction sera rappelée a chaque frame pour redessinner l'aire de jeu
function gestionnaireZonejeu(){
    for (let i=0; i<zoneDeJeu.length; i++){
        zoneDeJeu[i].afficheUneCase()
    }
}



/*                                Projectiles                                 */
class Projectiles {
    constructor(x,y){
        this.x = x
        this.y = y
        this.width = 10
        this.height = 10
        this.vitesse = 5 //vitesse de déplacement en pixels/frame (voir code plus bas)
        this.puissance = 20 //dégats infligés aux attaquants
    }

    avance(){
        this.x += this.vitesse //Mouvement sur l'axe x vers la droite ->
    }

    //On dessine le projectile
    afficheProjectile(){ 
        ctx.fillStyle = 'black'
        ctx.beginPath() //Il faut ici dessinner un rond, cette fonction définie le début du chemin.
        ctx.arc(this.x,this.y,this.width,0,Math.PI * 2) //trace un arc de cerclevoid ctx.arc(x, y, rayon, angleDépart, angleFin, sensAntiHoraire=false);
        ctx.fill() //remplis la forme qu'on a tracé 
        
    }
}
//toute la logique concernant les projectiles se fait ici ! 
function gestionnaireProjectiles(){ 
    for (let i=0; i<projectiles.length; i++){ //Parcours du tableau contenant les projectiles
        projectiles[i].avance()              
        projectiles[i].afficheProjectile()
        for (let j = 0; j < attaquants.length; j++){ //Parcours de tous les attaquants
            if (projectiles[i] && attaquants[j] && collision(projectiles[i],attaquants[j])) { //existe il un projectile qui cogne un attaquant?
                attaquants[j].vie -= projectiles[i].puissance //Dans tes dents
                projectiles.splice(i,1) // Paix a ton âme
                i-- // on oublie pas de retirer un a la boucle pour pas oublier un frère
            }
        }
        if(projectiles[i] && projectiles[i].x > canvas.width - tailleCase){ //Si le projectile arrive au bout de la ligne (- la taille d'une case pour leur laisser le temps d'arriver)
            projectiles.splice(i,1)                                         //On l'enlève proprement pour garder le tableau pas trop gros
            i--
        }
    }
}


/*                                Defenseurs                                   */
class Defenseur {
    constructor(x,y){
        this.x = x
        this.y = y
        this.width = tailleCase - espaceEntreCases
        this.height = tailleCase - espaceEntreCases
        this.enPleinTir = false 
        this.vie = 100 //Si plusieurs defenseurs differents on mettra ici un argument plûtot.
        this.timer = 0 // temporisation pour les tirs
    }
    //Meme principe que pour Projectile mais avec simplement un carré vert
    afficheDefenseur(){
        ctx.fillStyle = 'green'
        ctx.fillRect(this.x, this.y,this.width, this.height)
        ctx.fillStyle = jaune
        ctx.font = "20px Indie Flower"
        ctx.fillText(Math.floor(this.vie), this.x + 25 ,this.y + 25)
    }

    lanceProjectile(){ //Feu a volonté !!!!
        if(this.enPleinTir){
            
            this.timer ++
            if (this.timer % 100 === 0){ //tous les 100 frames envoie une boulette !
            projectiles.push(new Projectiles( this.x +50 , this.y + 50))
            }

        } else {
            this.timer = 0
        }

    }
}
//Ecouteurs d'evenement sur le click pour afficher un defenseur a l'emplacement de la souris
canvas.addEventListener('click',()=>{
    const positionZoneJeuX = souris.x - (souris.x % tailleCase) //(souris.x % tailleCase) me permet de ramener le defenseur proprement au début de la case 
    const positionZoneJeuY = souris.y - (souris.y % tailleCase) //(souris.y % tailleCase) pour rester bien aligné
    for (let i=0; i< defenseurs.length; i++){ //parcours des defenseurs
        if(defenseurs[i].x === positionZoneJeuX && defenseurs[i].y === positionZoneJeuY || positionZoneJeuY <    tailleCase) return //Si il y a dejà un defenseur ou si on est dans la barre de haut, annule
    }
    let coutDefenseur = 100 //C'est pas gratuit les tourelles !
    if (ressources >= coutDefenseur){ //Tu as assez?
        defenseurs.push(new Defenseur(positionZoneJeuX,positionZoneJeuY))
        ressources -= coutDefenseur
    } else {
        //ici je viendrai dire a l'utilisateur qu'il a pas assez de ressources
    }

})
//fonction qui gère la logique autours des defenseurs
function gestionnaireDefenseurs(){
    for (let i=0; i<defenseurs.length; i++){
        defenseurs[i].afficheDefenseur()
        defenseurs[i].lanceProjectile()
        if (positionAttaquants.indexOf(defenseurs[i].y) !== -1){
                defenseurs[i].enPleinTir = true
            }else { 
                defenseurs[i].enPleinTir = false
            }
            
        for (let j = 0; j<attaquants.length;j++){ //on verifie si il existe des collisions comme avec les projectiles
            
            if (defenseurs[i] && collision(defenseurs[i],attaquants[j])){
                attaquants[j].mouvement = 0
                defenseurs[i].vie -= 0.5 //Si il y en a l'attaquant s'arrete et grignote le defenseur
            }
            if(defenseurs[i] && defenseurs[i].vie <= 0){ //Paix a ton ame nous te vengerons
                defenseurs.splice( i , 1 )
                i--
                attaquants[j].mouvement = attaquants[j].vitesse
            }
        }
    }
}

/*                                Attaquants                                   */

class Attaquant{
    constructor(ligne){
        this.x=canvas.width //l'ennemi arrive toujours du fond
        this.y= ligne
        this.width = tailleCase - espaceEntreCases
        this.height = tailleCase - espaceEntreCases
        this.vie = 100
        this.maxVie = this.vie
        this.vitesse = (Math.random()* 0.4 * 0.7) // Ajuste le niveau de difficulté (vitesse de déplacement de l'ennemi)
        this.mouvement = this.vitesse 
        
    }
    avance(){
        this.x -= this.mouvement //mouvement sur l'axe x vers la gauche <-
    }
    afficheAttaquant(){
        ctx.fillStyle = 'red'
        ctx.fillRect(this.x, this.y,this.width, this.height)
        ctx.fillStyle = jaune
        ctx.font = "20px Indie Flower"
        ctx.fillText(Math.floor(this.vie), this.x + 25 ,this.y + 25) //affichage de la vie des personnages (ici attaquants)
    }
}
function gestionnaireAttaquants(){
    for (let i=0; i<attaquants.length; i++){
        attaquants[i].avance()
        attaquants[i].afficheAttaquant()
        if (attaquants[i].x < 0){ //Si un attaquant atteind l'autre coté, c'est perdu
            gameOver = true
        }
        if (attaquants[i].vie <=0 ) { //Quand on en tue un : 
           
            let gainRessource = attaquants[i].maxVie / 10
            ressources += gainRessource // On gagne des ressources
            let gainScore = attaquants[i].maxVie / 10 
            score += gainScore // et des points
            const trouveIndexAttaquant = positionAttaquants.indexOf(attaquants[i].y) // Parcours le tableau et trouve le premier attaquant qui est sur la ligne (y= 100 || 200 || 300 ...) et retourne son index ou -1 si il existe pas
            positionAttaquants.splice(trouveIndexAttaquant,1) // On l'enleve ici 
            attaquants.splice(i,1) //bien fait !
            i-- // Ceci est essentiel avec splice 
        }
    }
    if(frame % nbFrameEntreAttaquants === 0 && score < youWin){ //Si on est sur la frame ou l'ennemi doit apparaitre 
        let ligne = Math.floor(Math.random( ) * 5 + 1 ) * tailleCase // on choisit une ligne au pif
        attaquants.push(new Attaquant(ligne)) // on envoie un ennemi se faire massacrer

        positionAttaquants.push(ligne) // on mets un nombre dans un tableau pour savoir si il y a un ennemi sur la ligne 

        if(nbFrameEntreAttaquants > 150) nbFrameEntreAttaquants -= 50 // Les ennemis apparaissent de plus en plus vite !!! (pas trop quand même)
    }
}


/*                                Ressources                                    */
class Ressources{
    constructor (){
        this.x = Math.random( )* (canvas.width - tailleCase)
        this.y = (Math.floor(Math.random()* 5) + 1) * tailleCase + 25
        this.width = tailleCase * 0.6
        this.height = tailleCase * 0.6
        this.valeurRessource = valeurRessource[Math.floor(Math.random() * valeurRessource.length)]
    }
    afficheRessources(){
        ctx.fillStyle = jaune
        ctx.fillRect(this.x, this.y,this.width, this.height)
        ctx.fillStyle = 'black'
        ctx.font = "20px Indie Flower"
        ctx.fillText(Math.floor(this.valeurRessource), this.x + 25 ,this.y + 25)
    }
    

}
function gestionnaireRessources(){
    if(frame % 500 === 0 && score < youWin){   
        tableauRessources.push(new Ressources())
    }
    for(let i =0 ; i < tableauRessources.length ; i++){
        tableauRessources[i].afficheRessources()
        if(tableauRessources[i] && souris.x && souris.y && collision(tableauRessources[i],souris)){
            ressources += tableauRessources[i].valeurRessource
            tableauRessources.splice(i,1)
        }

    }
}

/*                                Utilitaires                                    */
//ici sont gérés les affichages en haut
function statutDuJeu(){
    ctx.fillStyle = jaune
    ctx.font = '40px Indie Flower'
    ctx.fillText(`Score : ${score} pts`,20,45)
    ctx.fillText(`Ressources : ${ressources}`,20,90)
    ctx.font = '50px Indie Flower'
    ctx.fillText(`Niveau : ${niveau}`,  500, 60)
    if(gameOver){
        ctx.fillStyle = 'black'
        ctx.font = '90px Indie Flower'
        ctx.fillText('Game Over',220,320)
    }
    if (score >= youWin){
        defenseurs = []
        attaquants = []
        projectiles = []
        positionAttaquants = []
        tableauRessources = []      
        ctx.fillStyle = 'black'
        ctx.font = '90px Indie Flower'
        ctx.fillText('You win !!!',300,320)

    }
}

// Fonction d'animation : 
// Cette fonction sert a faire tourner le jeu, on utilise ici requestAnimationFrame() (méthode de window) 
// qui notifie le navigateur que je souhaite exécuter une animation

function animation(){  
    ctx.clearRect(0, 0, canvas.width, canvas.height)     
    ctx.fillStyle = 'blue'  // Si je te demande de mettre une couleurs a l'interieur d'un élément, mets du bleu.
    ctx.fillRect( 0 , 0 , barreDuHaut.width , barreDuHaut.height) // Dessine un rectangle PLEIN en haut a gauche avec la taille de la barreDuHaut   
    gestionnaireZonejeu()   
    gestionnaireDefenseurs()
    gestionnaireRessources()
    gestionnaireProjectiles()
    gestionnaireAttaquants()
    statutDuJeu()
    frame++
    if (!gameOver){
        requestAnimationFrame(animation)
    }
    
}

animation()



//Fonction qui détermine si n'importe quel objet du jeu ayant une position x, une position y, une largeur et une hauteur sont en train de toucher
//Les elements ne peuvent pas sauter d'une ligne donc les comparaisons necessaires sont plutot simples : 

function collision(objet1,objet2){ 
    if ( ! ( objet1.x > objet2.x + objet2.width ||          // Si une seule des condition est vraie collision renverra false,
             objet1.x + objet1.width < objet2.x ||         // Si toutes les conditions sont fausse, on sait qu'on est en train de toucher alors on return true
             objet1.y > objet2.y + objet2.height ||
             objet1.y + objet1.height < objet2.y
            )){
                return true
            }
}

window.addEventListener('resize',()=>{
    monCanvasEstIci = canvas.getBoundingClientRect()
})
