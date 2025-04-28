export default function Button({label,action}){
    return <>
    <button onClick={action}>{label}</button><br />
    </>
}