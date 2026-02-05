import "../styles/Footer.css";

const Footer = () => {
    return ( 
        <div>
            <h3 style={{textAlign: "center"}}>Thanks for visiting!</h3>
            <h4 style={{textAlign: "center"}}>My Links:</h4>
            <div style={{display: "flex"}}>
                <div style={{display: "flex", margin: "auto"}}>
                    <a href="https://www.daxtonsutherlandworks.com/">Portfolio Website</a>
                    <p style={{margin: "0px", marginInline: "5px"}}>---</p>
                    <a href="https://www.linkedin.com/in/daxtons/">LinkedIn</a>
                </div>
            </div>
            <div className="update-card">
                <div className="update-card-inner">
                    <h1>V0.1.0 - DATE</h1>
                    <p>
                        Welcome to the very first version of Foggowar! Foggowar is a personal project I am putting together that is all about designing, sharing, and using custom table top roleplaying game maps
                        with an emphasis on line of sight and object travesability. Though it is only a small frontend demo of a limited size map maker now, I plan to add many extensive features that I will be keeping
                        secret for now.
                    </p>
                    <p>
                        For now, this just a public demo with very limited UI beyond the map designer. It is locked to a 10x10 grid, there are no fancy visuals, and the purple on green background is a... Bold, visual choice though unsuprising if you're familiar with my other projects.
                        Really, the more interesting bits of this version are in the source code, because everything you see here is scalable and designed to complement other parts of this project I have planned. I invite you to tinker around with my little project here, and feel free to have a look at my source code down below.
                    </p>
                    <h4>V0.1.0 Features:</h4>
                    <ul>
                        <li>All the basic brush features of the map desinger elements of this project.</li>
                        <ul>
                            <li>Lines.</li>
                            <li>Rectangles.</li>
                            <li>Circles.</li>
                            <li>Polygons.</li>
                            <li>One placeholder stamp, a pretty tree.</li>
                            <li>All with applicaiton and deletion.</li>
                        </ul>
                        <li>Undo and Redo commands.</li>
                        <li>A robust command based architecture to support future features.</li>
                        <li>Fun colors.</li>
                    </ul>
                    <p>If you're interested in other things I've made or just getting to know me, please visit one of my personal links above.</p>
                </div>
            </div>
        </div>
     );
}
 
export default Footer;