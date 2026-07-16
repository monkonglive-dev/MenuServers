cmake_minimum_required(VERSION 3.20)
project(Il2CppDumper LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)

add_executable(dumper dumper/dumper.cpp)
target_link_libraries(dumper PRIVATE psapi)
