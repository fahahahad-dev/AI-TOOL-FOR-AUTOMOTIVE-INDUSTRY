uint8_t ReadSensorValue(uint16_t *sensorData)
{
    uint8_t value;
    value = *sensorData / 2;
    if(value > 255)
    {
        value = 255;
    }
    return value;
}

void UpdateActuator(uint8_t command)
{
    uint8_t *actuatorPtr;
    actuatorPtr = (uint8_t *)0x40021000;
    *actuatorPtr = command;
}

int16_t ComputeTemperature(int16_t rawValue)
{
    int temp;
    temp = rawValue * 3 + 5;
    return temp;
}