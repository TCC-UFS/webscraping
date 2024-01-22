module.exports.wait = async (seconds) => {
    await new Promise((resolve) => setTimeout(() => resolve(), seconds*1000));
}